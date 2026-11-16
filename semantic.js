// ─── SMART SEARCH ────────────────────────────────────
// Optional search by meaning. A small multilingual model (run in
// semantic-worker.js) turns each task and the search text into vectors, and
// tasks whose vector points the same way as the search count as matches
// even when no words are shared. It all runs on this device and the task
// vectors stay in IndexedDB. Nothing is downloaded until the user turns it
// on and agrees, and nothing loads until the search bar is opened.
// Uses tasks, BUILT_IN_LABELS, showToast, applyFilterAndSearch, playLeave,
// endLeave and restoreFocus from app.js.

const SMART_MODEL = {
  id: 'Xenova/multilingual-e5-small',
  revision: '761b726dd34fb83930e26aab4e9ac3899aa1fa78',
  dtype: 'q8',
  // e5 expects these in front of the search text and the searched text
  queryPrefix: 'query: ',
  passagePrefix: 'passage: ',
};
// Stored vectors are only reused for this exact model
const SMART_MODEL_KEY = `${SMART_MODEL.id}@${SMART_MODEL.revision}/${SMART_MODEL.dtype}`;
// Model files and their sizes in bytes, for the progress bar. The whole
// first download with the runtime is about 138 MB.
const SMART_FILES = {
  'onnx/model_quantized.onnx': 118308185,
  'tokenizer.json': 17082730,
  'config.json': 658,
  'tokenizer_config.json': 443,
};
const SMART_BYTES = Object.values(SMART_FILES).reduce((a, b) => a + b, 0);
const SMART_DOWNLOAD_MB = 138;

// When a task counts as a meaning match. Each search is also compared with
// the everyday tasks below, which shows how close it is to "any task"; z is
// how far above that a task scores, in standard deviations. Strong matches
// always show, and up to 3 weaker ones show when they are about as close as
// the best one. Tuned on the vectors this app computes in the browser for a
// bilingual test set of 42 tasks and 28 searches.
const STRONG_Z = 3;
const CLOSE_Z = 2.5;
const CLOSE_MARGIN = 0.01;
const CLOSE_MAX = 3;
// Pause in typing before the search is turned into a vector (ms)
const QUERY_DELAY = 250;
// Shorter searches are left to normal search
const MIN_QUERY = 2;

const BACKGROUND_TASKS = [
  ['Update the phone apps', 'personal'], ['Order new printer ink', 'work'],
  ['Back up photos to the laptop', 'personal'], ['Return library books', 'university'],
  ['Plan the weekend trip', 'personal'], ['Write thank you notes', 'personal'],
  ['Change the air filter', 'personal'], ['Sign the contract', 'work'],
  ['Prepare slides for Monday', 'work'], ['Walk the dog', 'personal'],
  ['Drink more water', 'health'], ['Register for next semester', 'university'],
  ['Charge the power bank', 'other'], ['Send invoice to the client', 'work'],
  ['Organize the wardrobe', 'personal'], ['Learn ten new words', 'university'],
  ['Check the tyre pressure', 'other'], ['Cancel the old subscription', 'personal'],
  ['Take out the trash', 'personal'], ['Practice the guitar', 'personal'],
  ['ترتيب المكتب', 'work'], ['شراء هدية لصديقي', 'personal'],
  ['تحديث السيرة الذاتية', 'work'], ['زيارة جدتي', 'personal'],
  ['طباعة الأوراق المطلوبة', 'university'], ['نوم مبكر الليلة', 'health'],
  ['تنظيف الغرفة', 'personal'], ['الرد على رسائل الواتساب', 'personal'],
  ['تغيير كلمة المرور', 'other'], ['حفظ سورة الكهف', 'personal'],
  ['تعبئة البنزين', 'other'], ['كتابة ملخص الدرس', 'university'],
  ['إرسال الملف للزميل', 'work'], ['المشي نص ساعة', 'health'],
  ['طبخ العشاء', 'personal'], ['حجز موعد الحلاق', 'personal'],
  ['تحميل التطبيق الجديد', 'other'], ['مراجعة الميزانية الشهرية', 'personal'],
  ['Reply to the landlord', 'personal'], ['Fill in the survey', 'other'],
];

const smartToggle      = document.getElementById('btn-smart');
const smartPrefInput   = document.getElementById('pref-smart');
const smartHint        = document.getElementById('smart-hint');
const smartStatus      = document.getElementById('smart-status');
const smartStatusText  = document.getElementById('smart-status-text');
const smartProgress    = document.getElementById('smart-progress');
const smartProgressBar = document.getElementById('smart-progress-bar');
const smartOverlay     = document.getElementById('smart-overlay');

// off, asking (checking files or showing the prompt), loading (from the
// cache), downloading or ready
let smartState = 'off';
let smartWorker = null;
let smartLoaded = 0;
let smartPreparing = false;
let smartFrame = 0;
let smartDialogOpener = null;

// Task vectors by task id ({ id, text, model, vector }) and the background ones
const smartVectors = new Map();
let backgroundVectors = null;
// Recent searches: text -> { vector, mean, spread }
const smartQueries = new Map();
let smartQuery = '';
let smartPending = '';
let smartQueryTimer = null;
// Requests waiting for the worker, by id
const smartRequests = new Map();
let smartRequestId = 0;
let smartSyncing = false;
let smartSyncAgain = false;

function smartOn() {
  return localStorage.getItem('smartSearch') === 'on';
}

function smartSupported() {
  return typeof WebAssembly === 'object' && 'Worker' in window
    && 'indexedDB' in window && 'caches' in window;
}

// What is embedded for a task: its name and its label in both languages
function smartText(name, label) {
  if (!label) return name;
  const shown = BUILT_IN_LABELS.includes(label)
    ? `${STRINGS.en[`label.${label}`]} · ${STRINGS.ar[`label.${label}`]}`
    : label;
  return `${name} (${shown})`;
}

function smartDot(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

// ── Stored vectors ──

let smartDb = null;

function openSmartDb() {
  if (!smartDb) {
    smartDb = new Promise((resolve, reject) => {
      const request = indexedDB.open('task-manager-smart-search', 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('tasks', { keyPath: 'id' });
        request.result.createObjectStore('background', { keyPath: 'model' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    // A failed open is tried again next time
    smartDb.catch(() => { smartDb = null; });
  }
  return smartDb;
}

// Runs requests on one store and resolves when they are saved
function smartStore(name, mode, action) {
  return openSmartDb().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(name, mode);
    const request = action(tx.objectStore(name));
    tx.oncomplete = () => resolve(request ? request.result : undefined);
    tx.onerror = tx.onabort = () => reject(tx.error);
  }));
}

// A task's stored vector, if it was made from its current name and label
function smartVectorFor(task) {
  const saved = smartVectors.get(task.id);
  return saved && saved.text === smartText(task.name, task.label) ? saved.vector : null;
}

// Called whenever tasks are saved or reloaded. Vectors of deleted (or
// restored over) tasks are removed straight away; while smart search runs,
// new and edited tasks get theirs, a few at a time.
function smartTasksChanged() {
  if (localStorage.getItem('smartSearch') === null || !smartSupported()) return;
  if (smartSyncing) {
    smartSyncAgain = true;
    return;
  }
  smartSyncing = true;
  syncSmart().catch(() => {}).finally(() => {
    smartSyncing = false;
    if (smartSyncAgain) {
      smartSyncAgain = false;
      smartTasksChanged();
    }
  });
}

async function syncSmart() {
  const ids = new Set(tasks.map(task => task.id));
  const stored = await smartStore('tasks', 'readonly', store => store.getAllKeys());
  const gone = stored.filter(id => !ids.has(id));
  if (gone.length) await smartStore('tasks', 'readwrite', store => { gone.forEach(id => store.delete(id)); });
  gone.forEach(id => smartVectors.delete(id));

  if (smartState !== 'ready') return;
  const missing = tasks.filter(task => !smartVectorFor(task));
  for (let i = 0; i < missing.length; i += 8) {
    const batch = missing.slice(i, i + 8);
    const texts = batch.map(task => smartText(task.name, task.label));
    const vectors = await smartEmbed(texts, 'passage');
    const records = batch.map((task, j) => ({ id: task.id, text: texts[j], model: SMART_MODEL_KEY, vector: vectors[j] }));
    await smartStore('tasks', 'readwrite', store => { records.forEach(record => store.put(record)); });
    records.forEach(record => smartVectors.set(record.id, record));
  }
  // New vectors can add matches to the search on screen
  if (missing.length && smartQuery) applyFilterAndSearch();
}

// Stored task vectors, and the background vectors (made once per model)
async function loadSmartVectors() {
  const [saved, background] = await Promise.all([
    smartStore('tasks', 'readonly', store => store.getAll()),
    smartStore('background', 'readonly', store => store.get(SMART_MODEL_KEY)),
  ]);
  smartVectors.clear();
  saved.forEach(record => {
    if (record.model === SMART_MODEL_KEY) smartVectors.set(record.id, record);
  });
  const texts = BACKGROUND_TASKS.map(([name, label]) => smartText(name, label));
  if (background && background.texts.join('\n') === texts.join('\n')) {
    backgroundVectors = background.vectors;
    return;
  }
  const vectors = [];
  for (let i = 0; i < texts.length; i += 8) vectors.push(...await smartEmbed(texts.slice(i, i + 8), 'passage'));
  await smartStore('background', 'readwrite', store => { store.put({ model: SMART_MODEL_KEY, texts, vectors }); });
  backgroundVectors = vectors;
}

// ── Worker ──

function smartEmbed(texts, kind) {
  return new Promise((resolve, reject) => {
    if (!smartWorker) {
      reject(new Error('stopped'));
      return;
    }
    const id = ++smartRequestId;
    smartRequests.set(id, { resolve, reject });
    smartWorker.postMessage({ type: 'embed', id, kind, texts });
  });
}

function startSmart(download) {
  smartState = download ? 'downloading' : 'loading';
  smartLoaded = 0;
  smartPreparing = false;
  renderSmart();
  try {
    smartWorker = new Worker('semantic-worker.js', { type: 'module' });
  } catch (err) {
    failSmart(err);
    return;
  }
  smartWorker.addEventListener('message', onSmartMessage);
  // The script failed to load or run (old browser, out of memory)
  smartWorker.addEventListener('error', (e) => {
    e.preventDefault();
    failSmart(e.message || 'worker error');
  });
  smartWorker.postMessage({ type: 'load', model: SMART_MODEL });
}

function onSmartMessage({ data }) {
  if (data.type === 'progress') {
    smartLoaded = data.loaded;
    // At most one redraw per frame
    if (!smartFrame) {
      smartFrame = requestAnimationFrame(() => {
        smartFrame = 0;
        renderSmart();
      });
    }
  } else if (data.type === 'ready') {
    smartPreparing = true;
    renderSmart();
    prepareSmart();
  } else if (data.type === 'vectors' || data.type === 'dropped') {
    const request = smartRequests.get(data.id);
    smartRequests.delete(data.id);
    if (!request) return;
    if (data.type === 'vectors') request.resolve(data.vectors);
    else request.reject(new Error('dropped'));
  } else if (data.type === 'error') {
    failSmart(data.message);
  }
}

// The model is loaded: read the stored vectors, then catch up on tasks
async function prepareSmart() {
  const downloaded = smartState === 'downloading';
  try {
    await loadSmartVectors();
  } catch (err) {
    if (smartWorker) failSmart(err);
    return;
  }
  if (!smartWorker) return;
  smartState = 'ready';
  smartPreparing = false;
  renderSmart();
  if (downloaded) showToast(() => t('smart.ready'));
  smartTasksChanged();
  if (smartQuery) applyFilterAndSearch();
}

function stopSmart() {
  if (smartWorker) smartWorker.terminate();
  smartWorker = null;
  smartState = 'off';
  smartPreparing = false;
  clearTimeout(smartQueryTimer);
  smartPending = '';
  smartRequests.forEach(request => request.reject(new Error('stopped')));
  smartRequests.clear();
}

// Something went wrong: back to normal search, with one short message
function failSmart(reason) {
  const downloading = smartState === 'downloading';
  stopSmart();
  localStorage.setItem('smartSearch', 'off');
  renderSmart();
  applyFilterAndSearch();
  const offline = downloading && (!navigator.onLine || /fetch|network|load failed/i.test(String(reason)));
  showToast(() => t(offline ? 'smart.offline' : 'smart.unavailable'));
  console.info('Smart search is off:', String(reason));
}

// ── Turning it on and off ──

// True when the model files are in the browser cache, so starting needs no
// download (Transformers.js keys them by their full address)
async function smartCached() {
  try {
    const cache = await caches.open('transformers-cache');
    const found = await Promise.all(Object.keys(SMART_FILES).map(file =>
      cache.match(`https://huggingface.co/${SMART_MODEL.id}/resolve/${SMART_MODEL.revision}/${file}`)));
    return found.every(Boolean);
  } catch {
    return false;
  }
}

async function setSmart(on) {
  if (!on) {
    const cancelled = smartState === 'downloading';
    stopSmart();
    localStorage.setItem('smartSearch', 'off');
    renderSmart();
    applyFilterAndSearch();
    if (cancelled) showToast(() => t('smart.cancelled'));
    return;
  }
  if (smartState !== 'off') return;
  if (!smartSupported()) {
    failSmart('not supported');
    return;
  }
  smartState = 'asking';
  const cached = await smartCached();
  // Turned off again while checking
  if (smartState !== 'asking') return;
  if (cached) {
    localStorage.setItem('smartSearch', 'on');
    startSmart(false);
  } else if (!navigator.onLine) {
    smartState = 'off';
    renderSmart();
    showToast(() => t('smart.offline'));
  } else {
    openSmartDialog();
  }
}

// Opening the search bar starts smart search if it is on. If its files are
// gone (cleared, or the download never finished) it turns off until the
// user turns it on again and agrees to the download.
async function smartSearchOpened() {
  if (!smartOn() || smartState !== 'off') return;
  if (!smartSupported()) {
    failSmart('not supported');
    return;
  }
  smartState = 'asking';
  const cached = await smartCached();
  if (smartState !== 'asking' || !smartOn()) return;
  if (cached) {
    startSmart(false);
  } else {
    smartState = 'off';
    localStorage.setItem('smartSearch', 'off');
    renderSmart();
  }
}

function openSmartDialog() {
  smartDialogOpener = document.activeElement;
  renderSmart();
  smartOverlay.classList.remove('leaving');
  smartOverlay.classList.add('active');
  document.getElementById('btn-smart-no').focus();
}

function closeSmartDialog(download = false) {
  if (!smartOverlay.classList.contains('active')) return;
  smartOverlay.classList.remove('active');
  playLeave(smartOverlay);
  smartState = 'off';
  if (download) {
    localStorage.setItem('smartSearch', 'on');
    startSmart(true);
  } else {
    renderSmart();
  }
  restoreFocus(smartDialogOpener, smartToggle);
}

// ── Searching ──

// Meaning matches among the candidates (all tasks that are not word
// matches), closest first. The search text becomes a vector after a short
// pause in typing, and the list is redrawn when it is ready.
function smartMatches(text, candidates) {
  const query = text.replace(/\s+/g, ' ').trim();
  smartQuery = query;
  if (smartState !== 'ready' || query.length < MIN_QUERY) return [];
  const known = smartQueries.get(query);
  if (!known) {
    if (candidates.length) scheduleSmartQuery(query);
    return [];
  }
  const scored = [];
  candidates.forEach(task => {
    const vector = smartVectorFor(task);
    if (!vector) return;
    const score = smartDot(known.vector, vector);
    scored.push({ task, score, z: (score - known.mean) / known.spread });
  });
  scored.sort((a, b) => b.score - a.score);
  const best = scored.length ? scored[0].score : 0;
  // While some tasks still wait for their vector, the best match so far
  // may not be the real best, so only strong matches show
  const complete = scored.length === candidates.length;
  return scored
    .filter((match, i) => match.z >= STRONG_Z
      || (complete && i < CLOSE_MAX && match.z >= CLOSE_Z && match.score >= best - CLOSE_MARGIN))
    .map(match => match.task);
}

// True while the search on screen still waits for its meaning matches, so
// the list does not flash "no tasks" just before they arrive
function smartWaiting() {
  return smartState === 'ready' && smartPending !== '' && smartPending === smartQuery && !smartQueries.has(smartQuery);
}

function scheduleSmartQuery(query) {
  if (query === smartPending) return;
  smartPending = query;
  clearTimeout(smartQueryTimer);
  smartQueryTimer = setTimeout(async () => {
    try {
      const [vector] = await smartEmbed([query], 'query');
      const scores = backgroundVectors.map(b => smartDot(vector, b));
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
      const spread = Math.sqrt(scores.reduce((a, b) => a + (b - mean) ** 2, 0) / scores.length) || 1;
      smartQueries.set(query, { vector, mean, spread });
      // Only the last 20 searches are kept
      if (smartQueries.size > 20) smartQueries.delete(smartQueries.keys().next().value);
      if (query === smartQuery) applyFilterAndSearch();
    } catch {
      // A newer search took its place, or smart search was turned off
    }
    if (smartPending === query) smartPending = '';
  }, QUERY_DELAY);
}

// ── Display ──

// The search bar toggle, the menu switch and its line, the download panel
// and the prompt's size, in the current language
function renderSmart() {
  const on = smartOn();
  const percent = Math.min(100, Math.round(smartLoaded / SMART_BYTES * 100));
  smartToggle.setAttribute('aria-pressed', String(on));
  smartToggle.classList.toggle('busy', smartState === 'loading' || smartState === 'downloading');
  smartPrefInput.checked = on;

  smartHint.textContent = smartState === 'downloading' ? t('smart.hintDownloading', { percent })
    : smartState === 'loading' ? t('smart.hintLoading')
    : t(on ? 'smart.hintOn' : 'smart.hintOff');

  smartStatus.hidden = smartState !== 'downloading';
  smartStatusText.textContent = smartPreparing ? t('smart.preparing') : t('smart.downloading', { percent });
  smartProgressBar.style.width = `${smartPreparing ? 100 : percent}%`;
  smartProgress.setAttribute('aria-valuenow', smartPreparing ? 100 : percent);

  document.getElementById('smart-size').textContent = t('smart.size', { size: SMART_DOWNLOAD_MB });
  document.getElementById('btn-smart-yes').textContent = t('smart.download', { size: SMART_DOWNLOAD_MB });
}

smartToggle.addEventListener('click', () => setSmart(!smartOn()));
smartPrefInput.addEventListener('change', () => setSmart(smartPrefInput.checked));
document.getElementById('btn-smart-cancel').addEventListener('click', () => setSmart(false));
document.getElementById('btn-smart-yes').addEventListener('click', () => closeSmartDialog(true));
document.getElementById('btn-smart-no').addEventListener('click', () => closeSmartDialog());
document.getElementById('btn-close-smart').addEventListener('click', () => closeSmartDialog());
smartOverlay.addEventListener('click', (e) => {
  if (e.target === smartOverlay) closeSmartDialog();
});
smartOverlay.addEventListener('animationend', (e) => endLeave(e));
