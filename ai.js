// ─── AI FEATURES ─────────────────────────────────────
// Quick add in plain words, label and priority suggestions while a new
// task's name is typed, and Plan my day. Each sends text to the app's
// Worker (worker/ in the repo), which asks Claude and checks the answer.
// app.js adds this file and ai.css only once AI features are turned on in
// the menu (loadAi), and every text is in i18n.js. Nothing here saves or
// changes a task: answers only fill the form or show a plan. Uses tasks,
// openModal, setDeadline, defaultDeadline, quickDate, the modal fields,
// the date helpers, showToast, playLeave, endLeave, restoreFocus and
// trapTab from app.js.

const AI_URL = 'https://task-manager-ai.ahmedalsoufi14.workers.dev';
// Most tasks sent to Plan my day (the Worker allows 25)
const PLAN_MAX = 25;
// The same tasks get the same plan back for this long, unless Plan again
const PLAN_REUSE_MS = 15 * 60 * 1000;
// Suggestions are asked for after a pause in typing, once per name
const SUGGEST_DELAY = 800;
const SUGGEST_CACHE_SIZE = 200;

const aiOn = () => localStorage.getItem('ai') === 'on';
const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
// At most max characters (not UTF-16 units), as the Worker counts them
const clip = (text, max) => Array.from(text).slice(0, max).join('');

// POST to the Worker: { data }, or { error } that is offline,
// rate_limited, daily_limit or failed
async function aiRequest(path, body, timeout) {
  if (!navigator.onLine) return { error: 'offline' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(AI_URL + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data) return { data };
    return { error: data && ['rate_limited', 'daily_limit'].includes(data.error) ? data.error : 'failed' };
  } catch {
    return { error: navigator.onLine ? 'failed' : 'offline' };
  } finally {
    clearTimeout(timer);
  }
}

const ERROR_KEYS = { offline: 'ai.offline', rate_limited: 'ai.rateLimited', daily_limit: 'ai.dailyLimit', failed: 'ai.failed' };

// Briefly rings the fields an answer filled in
function flashFields(fields) {
  fields.forEach(field => {
    field.classList.remove('ai-filled');
    field.getBoundingClientRect();
    field.classList.add('ai-filled');
  });
}

// ── Quick add ──
// Enter (or the arrow) sends the words with the time now and the time
// zone; the answer fills the add form for the user to check and save.
// Offline or on any failure the words become the name.

const aiQuickInput  = document.getElementById('ai-quick-input');
const aiQuickBar    = document.getElementById('ai-quick');
const aiQuickStatus = document.getElementById('ai-quick-status');
const aiGo          = document.getElementById('btn-ai-go');
const aiMic         = document.getElementById('btn-ai-mic');

let quickBusy = false;

// A note at the top of the form says how it was filled in
const aiNote = document.createElement('p');
aiNote.className = 'ai-note';
aiNote.setAttribute('role', 'status');
aiNote.hidden = true;
aiNote.innerHTML = '<i data-lucide="wand-sparkles" aria-hidden="true"></i><span></span>';
modalOverlay.querySelector('.modal-body').prepend(aiNote);

const NOTE_KEYS = { offline: 'ai.noteOffline', rate_limited: 'ai.noteBusy', daily_limit: 'ai.noteDaily', failed: 'ai.noteFailed' };

async function quickAdd() {
  const text = aiQuickInput.value.trim();
  if (!text || quickBusy || !aiOn()) return;
  stopListening();
  quickBusy = true;
  renderQuick();
  const result = await aiRequest('/parse', {
    text: clip(text, 300), now: toDatetimeValue(new Date()), tz: timeZone(), lang: currentLang,
  }, 12000);
  quickBusy = false;

  // Another dialog came up meanwhile: the words stay in the bar
  if (document.querySelector('.modal-overlay.active') || document.documentElement.classList.contains('touring')) {
    renderQuick();
    return;
  }
  if (aiQuickInput.value.trim() === text) aiQuickInput.value = '';
  renderQuick();
  if (asideOverlay.classList.contains('active')) closeAside();

  openModal();
  if (result.data) {
    fillForm(result.data);
    showNote('ai.noteFilled');
  } else {
    inputName.value = text;
    showNote(NOTE_KEYS[result.error]);
  }
}

function fillForm(task) {
  const fallback = defaultDeadline();
  let { date, time } = task;
  // A time with no day: today if it is still ahead, otherwise tomorrow
  if (time && !date) {
    const now = toDatetimeValue(new Date());
    date = now.slice(11) < time ? now.slice(0, 10) : quickDate('tomorrow');
  }
  const filled = [inputName];
  inputName.value = task.name;
  if (date || time) {
    setDeadline(`${date || fallback.slice(0, 10)}T${time || fallback.slice(11)}`);
    filled.push(inputDate, inputTime);
  }
  if (task.label) {
    inputLabel.value = task.label;
    customLabelGroup.style.display = 'none';
    filled.push(inputLabel);
  }
  if (task.priority) {
    inputPriority.value = task.priority;
    filled.push(inputPriority);
  }
  // Only when the words asked for one; older answers have no reminder
  if (task.reminder !== undefined && validReminder(task.reminder)) {
    setReminderField(task.reminder);
    filled.push(inputReminder);
  }
  // What the answer set counts as chosen, so a suggestion won't flip it
  suggestChosen = { label: !!task.label, priority: !!task.priority };
  flashFields(filled);
}

let aiNoteKey = null;

function showNote(key) {
  aiNoteKey = key;
  aiNote.hidden = false;
  renderNote();
}

function renderNote() {
  if (aiNoteKey) aiNote.querySelector('span').textContent = t(aiNoteKey);
}

function renderQuick() {
  aiQuickBar.classList.toggle('busy', quickBusy);
  aiQuickBar.setAttribute('aria-busy', String(quickBusy));
  aiGo.disabled = !aiQuickInput.value.trim();
  aiQuickStatus.textContent = quickBusy ? t('ai.reading') : '';
  // Names that change with the state also follow a language switch
  const micKey = listening ? 'ai.micStop' : 'ai.mic';
  aiMic.dataset.i18nTitle = micKey;
  aiMic.dataset.i18nAriaLabel = micKey;
  aiMic.title = t(micKey);
  aiMic.setAttribute('aria-label', t(micKey));
  aiMic.setAttribute('aria-pressed', String(listening));
  aiQuickInput.dataset.i18nPlaceholder = listening ? 'ai.listening' : 'ai.quickPlaceholder';
  aiQuickInput.placeholder = t(aiQuickInput.dataset.i18nPlaceholder);
}

aiQuickInput.addEventListener('input', renderQuick);
aiQuickInput.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || e.isComposing || e.repeat) return;
  e.preventDefault();
  quickAdd();
});
aiGo.addEventListener('click', quickAdd);

// ── Voice ──
// The browser's own speech recognition, in the app's language. What it
// hears goes into the bar and is sent as soon as the speaker stops.

const SpeechRecognizer = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let listening = false;

function toggleListening() {
  if (listening) {
    stopListening();
    return;
  }
  if (!SpeechRecognizer || quickBusy) return;
  recognition = new SpeechRecognizer();
  recognition.lang = currentLang === 'ar' ? 'ar-SA' : 'en-US';
  recognition.interimResults = true;
  let heard = '';
  let failure = null;
  recognition.onresult = (e) => {
    heard = [...e.results].map(result => result[0].transcript).join('').trim();
    aiQuickInput.value = heard;
    renderQuick();
  };
  recognition.onerror = (e) => { failure = e.error; };
  recognition.onend = () => {
    recognition = null;
    listening = false;
    renderQuick();
    if (failure === 'not-allowed' || failure === 'service-not-allowed') showToast(() => t('ai.micBlocked'));
    else if (failure === 'no-speech' || (!failure && !heard)) showToast(() => t('ai.micNothing'));
    else if (failure && failure !== 'aborted') showToast(() => t('ai.micFailed'));
    else if (heard) quickAdd();
  };
  try {
    recognition.start();
  } catch {
    recognition = null;
    showToast(() => t('ai.micFailed'));
    return;
  }
  listening = true;
  renderQuick();
}

function stopListening() {
  if (recognition) recognition.stop();
}

aiMic.addEventListener('click', toggleListening);

// ── Suggestions ──
// While a new task's name is typed, a pause asks for a label and priority.
// The answer shows under the name and is used only when tapped, and only
// for the fields the user hasn't picked. Answers are kept by name, so the
// same name is never sent twice.

const suggestRow = document.createElement('div');
suggestRow.className = 'ai-suggest';
suggestRow.id = 'ai-suggest';
suggestRow.innerHTML = `
  <p class="ai-suggest-idle"><i data-lucide="sparkles" aria-hidden="true"></i><span></span></p>
  <button type="button" class="ai-suggest-chip" hidden>
    <i data-lucide="sparkles" aria-hidden="true"></i>
    <span class="ai-suggest-kicker"></span>
    <span class="ai-suggest-text"></span>
    <i class="ai-suggest-plus" data-lucide="plus" aria-hidden="true"></i>
  </button>`;
inputName.after(suggestRow);
const suggestIdle = suggestRow.querySelector('.ai-suggest-idle');
const suggestChip = suggestRow.querySelector('.ai-suggest-chip');

let suggestFor = false;       // the form is adding a new task
let suggestChosen = { label: false, priority: false };
let suggestion = null;        // { label, priority } for the current name
let suggestTimer = null;
let suggestLoading = false;

function suggestKey(name) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Name -> { label, priority }, oldest first, in localStorage
function suggestCache() {
  try {
    return new Map(Object.entries(JSON.parse(localStorage.getItem('aiSuggest') || '{}')));
  } catch {
    return new Map();
  }
}

function rememberSuggestion(key, answer) {
  const cache = suggestCache();
  cache.delete(key);
  cache.set(key, answer);
  while (cache.size > SUGGEST_CACHE_SIZE) cache.delete(cache.keys().next().value);
  localStorage.setItem('aiSuggest', JSON.stringify(Object.fromEntries(cache)));
}

// The parts the user hasn't picked, or null if none would change anything
function suggestionParts() {
  if (!suggestion) return null;
  const label = suggestChosen.label ? null : suggestion.label;
  const priority = suggestChosen.priority ? null : suggestion.priority;
  const changes = (label && label !== inputLabel.value) || (priority && priority !== inputPriority.value);
  return changes ? { label, priority } : null;
}

function suggestionText(parts) {
  return [parts.label && labelName(parts.label), parts.priority && t(`priority.${parts.priority}`)]
    .filter(Boolean).join(' · ');
}

async function requestSuggestion() {
  const name = inputName.value.trim();
  if (!suggestFor || !aiOn() || Array.from(name).length < 3) return;
  if (suggestChosen.label && suggestChosen.priority) return;
  const key = suggestKey(clip(name, 120));
  let answer = suggestCache().get(key);
  if (!answer) {
    if (!navigator.onLine) return;
    suggestLoading = true;
    renderSuggest();
    const result = await aiRequest('/suggest', { name: clip(name, 120), lang: currentLang }, 8000);
    suggestLoading = false;
    if (result.data) {
      answer = result.data;
      rememberSuggestion(key, answer);
    }
  }
  // Only if the name is still the one asked about
  if (answer && suggestFor && inputName.value.trim() === name) suggestion = answer;
  renderSuggest();
}

function applySuggestion() {
  const parts = suggestionParts();
  if (!parts) return;
  const filled = [];
  if (parts.label) {
    inputLabel.value = parts.label;
    customLabelGroup.style.display = 'none';
    suggestChosen.label = true;
    filled.push(inputLabel);
  }
  if (parts.priority) {
    inputPriority.value = parts.priority;
    suggestChosen.priority = true;
    filled.push(inputPriority);
  }
  suggestion = null;
  renderSuggest();
  flashFields(filled);
  inputName.focus();
}

function renderSuggest() {
  suggestRow.hidden = !suggestFor || !aiOn();
  const parts = suggestionParts();
  suggestChip.hidden = !parts;
  suggestIdle.hidden = !!parts;
  suggestRow.classList.toggle('busy', suggestLoading);
  suggestIdle.querySelector('span').textContent = t(suggestLoading ? 'ai.suggestLoading' : 'ai.suggestIdle');
  if (parts) {
    const text = suggestionText(parts);
    suggestChip.querySelector('.ai-suggest-kicker').textContent = t('ai.suggested');
    suggestChip.querySelector('.ai-suggest-text').textContent = text;
    suggestChip.setAttribute('aria-label', t('ai.suggestApply', { text }));
  }
}

inputName.addEventListener('input', () => {
  if (!suggestFor || !aiOn()) return;
  clearTimeout(suggestTimer);
  suggestion = null;
  renderSuggest();
  suggestTimer = setTimeout(requestSuggestion, SUGGEST_DELAY);
});

// A label or priority picked by hand is never replaced
inputLabel.addEventListener('change', () => {
  suggestChosen.label = true;
  renderSuggest();
});
inputPriority.addEventListener('change', () => {
  suggestChosen.priority = true;
  renderSuggest();
});
suggestChip.addEventListener('click', applySuggestion);

// Called by openModal: suggestions only for a new task, and no note
// unless quick add fills the form
function aiModalOpened(task) {
  suggestFor = !task;
  suggestChosen = { label: false, priority: false };
  suggestion = null;
  suggestLoading = false;
  clearTimeout(suggestTimer);
  aiNote.hidden = true;
  aiNoteKey = null;
  renderSuggest();
}

// ── Plan my day ──
// Today's and overdue open tasks (name, deadline, label and priority only)
// go to the Worker, which answers with an order and a reason for each.
// The plan shows in a dialog and changes nothing.

const planBtn = document.getElementById('btn-ai-plan');
const planOverlay = document.createElement('div');
planOverlay.className = 'modal-overlay ai-plan-overlay';
planOverlay.id = 'ai-plan-overlay';
planOverlay.innerHTML = `
  <div class="modal ai-plan-dialog" role="dialog" aria-modal="true" aria-labelledby="ai-plan-title" aria-describedby="ai-plan-intro">
    <div class="modal-header">
      <h2 class="modal-title" id="ai-plan-title" data-i18n="ai.planTitle"></h2>
      <button class="icon-btn" id="btn-close-plan" data-i18n-title="modal.close" data-i18n-aria-label="modal.close">
        <i data-lucide="x"></i>
      </button>
    </div>
    <p class="ai-plan-intro" id="ai-plan-intro" data-i18n="ai.planIntro"></p>
    <div class="ai-plan-body" id="ai-plan-body" aria-live="polite"></div>
    <div class="modal-footer">
      <button class="btn-secondary" id="btn-plan-again" data-i18n="ai.planAgain"></button>
      <button class="btn-main" id="btn-plan-done" data-i18n="ai.planDone"></button>
    </div>
  </div>`;
document.body.append(planOverlay);
const planBody = document.getElementById('ai-plan-body');
const planAgain = document.getElementById('btn-plan-again');

let planOpener = null;
// { status: loading | ready | empty | error, error, items: [{ id, reason }],
//   more, key, at, shown }
let planState = null;
let planRequestId = 0;

const DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

function planTasks() {
  const today = toDateValue(new Date());
  return tasks
    .filter(task => !task.completed && !task.sample && DATETIME.test(task.datetime || '')
      && (isOverdue(task) || task.datetime.slice(0, 10) === today))
    .sort((a, b) => a.datetime.localeCompare(b.datetime));
}

function openPlan(opener, again = false) {
  if (!aiOn()) return;
  if (opener) planOpener = opener;
  if (!planOverlay.classList.contains('active')) {
    planOverlay.classList.remove('leaving');
    planOverlay.classList.add('active');
    document.getElementById('btn-close-plan').focus();
  }

  const list = planTasks().slice(0, PLAN_MAX);
  const total = planTasks().length;
  if (!list.length) {
    planState = { status: 'empty' };
    renderPlan();
    return;
  }
  const body = {
    now: toDatetimeValue(new Date()), tz: timeZone(), lang: currentLang,
    tasks: list.map(task => ({
      name: clip(task.name || '-', 120),
      deadline: task.datetime.slice(0, 16),
      label: clip(task.label || 'other', 40),
      priority: ['high', 'medium', 'low'].includes(task.priority) ? task.priority : 'low',
    })),
  };
  // Same tasks and language as a recent plan: show it again for free
  const key = JSON.stringify([currentLang, list.map(task => task.id), body.tasks]);
  if (!again && planState && planState.status === 'ready' && planState.key === key
    && Date.now() - planState.at < PLAN_REUSE_MS) {
    renderPlan();
    return;
  }
  requestPlan(body, list, key, total > PLAN_MAX);
}

async function requestPlan(body, list, key, more) {
  const id = ++planRequestId;
  planState = { status: 'loading' };
  renderPlan();
  const result = await aiRequest('/plan', body, 25000);
  if (id !== planRequestId) return;
  planState = result.error
    ? { status: 'error', error: result.error }
    : {
      status: 'ready', key, at: Date.now(), more,
      items: result.data.plan.map(item => ({ id: list[item.task - 1]?.id, reason: item.reason })).filter(item => item.id),
    };
  renderPlan();
}

function closePlan() {
  if (!planOverlay.classList.contains('active')) return;
  planRequestId++;
  if (planState && planState.status === 'loading') planState = null;
  planOverlay.classList.remove('active');
  playLeave(planOverlay);
  restoreFocus(planOpener, btnAdd);
}

function planMessage(icon, key) {
  const box = document.createElement('div');
  box.className = 'ai-plan-message';
  box.innerHTML = `<span class="ai-plan-badge" aria-hidden="true"><i data-lucide="${icon}"></i></span><p></p>`;
  box.querySelector('p').textContent = t(key);
  return box;
}

// One step: number, name, label and priority, when it is due, and why
function planItem(task, reason, index, enter) {
  const overdue = isOverdue(task);
  const item = document.createElement('li');
  item.className = 'ai-plan-item' + (overdue ? ' overdue' : '') + (enter ? ' enter' : '');
  item.style.setProperty('--i', index);
  const priorityTitle = PRIORITY_RANK[task.priority] === undefined ? '' : t(`priorityDot.${task.priority}`);
  item.innerHTML = `
    <span class="ai-plan-num" aria-hidden="true">${formatDigits(String(index + 1))}</span>
    <div class="ai-plan-text">
      <p class="ai-plan-name" dir="auto">${escapeHTML(task.name)}</p>
      <p class="ai-plan-meta">
        <span class="task-relative${overdue ? ' task-overdue' : ''}" title="${formatFullDate(task.datetime)}">${formatRelative(task)}</span>
        <span class="task-label" dir="auto">
          <i data-lucide="${LABEL_ICONS[task.label] || 'tag'}" aria-hidden="true"></i>
          <span class="task-label-text">${escapeHTML(labelName(task.label))}</span>
        </span>
        <span class="task-priority priority-${task.priority}" role="img" title="${priorityTitle}" aria-label="${priorityTitle}"><span></span><span></span><span></span></span>
      </p>
      ${reason ? `<p class="ai-plan-reason" dir="auto">${escapeHTML(reason)}</p>` : ''}
    </div>`;
  return item;
}

function renderPlan() {
  if (!planState) return;
  const { status } = planState;
  planBody.replaceChildren();
  planBody.setAttribute('aria-busy', String(status === 'loading'));
  planAgain.hidden = status === 'empty';
  planAgain.disabled = status === 'loading';

  if (status === 'loading') {
    const skeleton = document.createElement('div');
    skeleton.className = 'ai-plan-loading';
    skeleton.innerHTML = `<p class="ai-plan-status"></p>${'<div class="ai-plan-skeleton"><span></span><span></span></div>'.repeat(3)}`;
    skeleton.querySelector('p').textContent = t('ai.planLoading');
    planBody.append(skeleton);
  } else if (status === 'empty') {
    planBody.append(planMessage('sun', 'ai.planEmpty'));
  } else if (status === 'error') {
    planBody.append(planMessage(planState.error === 'offline' ? 'wifi-off' : 'circle-alert', ERROR_KEYS[planState.error]));
  } else {
    const list = document.createElement('ol');
    list.className = 'ai-plan-list';
    // Steps rise in the first time a plan shows, not when it is redrawn
    const enter = !planState.shown;
    planState.items
      .map(item => ({ task: tasks.find(task => task.id === item.id), reason: item.reason }))
      .filter(item => item.task)
      .forEach((item, i) => list.append(planItem(item.task, item.reason, i, enter)));
    planState.shown = true;
    planBody.append(list);
    if (planState.more) {
      const more = document.createElement('p');
      more.className = 'ai-plan-more';
      more.textContent = t('ai.planMore', { count: PLAN_MAX });
      planBody.append(more);
    }
  }
  lucide.createIcons({ root: planBody });
}

planBtn.addEventListener('click', (e) => openPlan(e.currentTarget));
planAgain.addEventListener('click', () => openPlan(null, true));
document.getElementById('btn-plan-done').addEventListener('click', closePlan);
document.getElementById('btn-close-plan').addEventListener('click', closePlan);
planOverlay.addEventListener('click', (e) => {
  if (e.target === planOverlay) closePlan();
});
planOverlay.addEventListener('animationend', endLeave);
planOverlay.addEventListener('keydown', (e) => trapTab(e, planOverlay));

// Esc closes the plan (before app.js closes anything under it), and the
// N shortcut waits while it is open
window.addEventListener('keydown', (e) => {
  if (!planOverlay.classList.contains('active')) return;
  if (e.key === 'Escape') {
    e.stopPropagation();
    closePlan();
  } else if (e.code === 'KeyN' && !isTypingTarget(e.target)) {
    e.stopPropagation();
  }
}, true);

// ── Setting ──

// Turned off: the mic stops, the plan closes and suggestions go away.
// Turned on again: everything is ready as before.
function aiChanged() {
  if (!aiOn()) {
    stopListening();
    closePlan();
    clearTimeout(suggestTimer);
    suggestion = null;
  }
  renderAi();
}

function renderAi() {
  renderQuick();
  renderSuggest();
  renderNote();
  if (planOverlay.classList.contains('active')) renderPlan();
}

// Loaded after the page: translate and draw the new parts
translatePage();
lucide.createIcons();
renderAi();
