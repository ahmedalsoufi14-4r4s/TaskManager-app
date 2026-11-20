// ─── TOUR AND HELP ───────────────────────────────────
// The tour dims the page around one real element at a time and explains it
// in a small card beside it. Help is a panel with the same explanations,
// quick tips, a search box and the keyboard shortcuts. app.js adds this
// file and tour.css the first time either is opened (startTour,
// openHelpPanel), and every text comes from i18n.js. Uses tasks, selectedIds, currentFilter,
// the page elements and many helpers from app.js.

// One step per feature, in the order a new user meets them. target gives
// the element (or neighbouring elements) to point at. modal, aside, filters
// and search say what must be open; list steps show every task (filters
// and search are set aside for them); select steps select one task. ai
// steps are in the tour only while AI features are on (ai.js), and always
// in Help.
const TOUR_STEPS = [
  { id: 'add', icon: 'plus', target: () => btnAdd },
  { id: 'quickadd', icon: 'wand-sparkles', ai: true, target: () => document.getElementById('ai-quick') },
  { id: 'date', icon: 'calendar', modal: true, target: () => document.querySelectorAll('.deadline-field')[0] },
  { id: 'time', icon: 'clock', modal: true, target: () => document.querySelectorAll('.deadline-field')[1] },
  { id: 'preview', icon: 'calendar-clock', modal: true, target: () => [deadlineSummary, deadlineWarning] },
  { id: 'reminder', icon: 'bell-ring', modal: true, target: () => [document.querySelector('label[for="input-reminder"]'), inputReminder] },
  { id: 'suggest', icon: 'sparkles', ai: true, modal: true, target: () => [inputName, document.getElementById('ai-suggest')] },
  { id: 'select', icon: 'mouse-pointer-click', list: true, select: true, target: () => tourRow('open') },
  { id: 'edit', icon: 'pencil', list: true, select: true, target: () => [btnDelete, btnEdit] },
  { id: 'complete', icon: 'square-check-big', list: true, target: () => tourCheckbox() },
  { id: 'overdue', icon: 'lock', list: true, target: () => tourRow('overdue') },
  { id: 'groups', icon: 'layers', list: true, target: () => taskListEl.querySelector('.group-header') || emptyStateEl },
  { id: 'progress', icon: 'target', target: () => document.querySelector('.stats') },
  { id: 'filters', icon: 'funnel', filters: true, target: () => filterBar },
  { id: 'sort', icon: 'arrow-down-up', target: () => document.querySelector('.sort-control') },
  { id: 'plan', icon: 'list-ordered', ai: true, target: () => document.getElementById('btn-ai-plan') },
  { id: 'search', icon: 'search', search: true, target: () => searchBar },
  { id: 'smart', icon: 'sparkles', search: true, target: () => document.getElementById('btn-smart') },
  { id: 'language', icon: 'languages', target: () => btnLang },
  { id: 'theme', icon: 'sun-moon', aside: true, target: () => prefTheme.closest('.pref-row') },
  { id: 'notifications', icon: 'bell', aside: true,
    target: () => [prefNotif.closest('.pref-row'), prefReminder.closest('.pref-row')] },
  { id: 'ai', icon: 'wand-sparkles', aside: true, target: () => prefAi.closest('.pref-row') },
  { id: 'export', icon: 'file-text', aside: true, target: () => document.getElementById('btn-export') },
  { id: 'backup', icon: 'database-backup', aside: true,
    target: () => [document.getElementById('btn-backup'), document.getElementById('btn-restore')] },
  { id: 'shortcuts', icon: 'keyboard', aside: true, target: () => document.querySelector('.shortcuts') },
  { id: 'install', icon: 'smartphone', aside: true, target: () => document.getElementById('btn-install-help') },
  { id: 'help', icon: 'circle-help', aside: true,
    target: () => [document.getElementById('btn-tour'), document.getElementById('btn-help')] },
];

// Numbers in the texts: the smart search download (SMART_DOWNLOAD_MB in
// semantic.js, which may not be loaded)
const GUIDE_PARAMS = {
  smart: { size: 138 },
};

function guideText(id) {
  return t(`guide.${id}.text`, GUIDE_PARAMS[id]);
}

// A card to point at: 'open' (not overdue or done) or 'overdue', else the
// first card, else the empty list message
function tourRow(kind) {
  const rows = [...taskListEl.querySelectorAll('.task-row')];
  const match = rows.find(row => kind === 'overdue'
    ? row.classList.contains('overdue')
    : !row.classList.contains('overdue') && !row.classList.contains('completed'));
  return match || rows[0] || emptyStateEl;
}

// A box that can still be ticked, else a card
function tourCheckbox() {
  return taskListEl.querySelector('.task-checkbox:enabled:not(:checked)') || tourRow('open');
}

// ── Sample tasks ──
// For a tour with an empty list: one overdue, one due today, one later and
// one done, so every step has something to show. They live only in memory
// (saveTasks leaves them out), say "Sample" on their card and go when the
// tour ends, or with the page if it is closed or reloaded.
const TOUR_SAMPLES = [
  { key: 'bill', label: 'personal', priority: 'medium', due: () => tourFromNow(-120) },
  { key: 'report', label: 'work', priority: 'high', due: () => tourLaterToday() },
  { key: 'dentist', label: 'health', priority: 'low', due: () => tourFromNow(3 * 24 * 60) },
  { key: 'reading', label: 'university', priority: 'medium', completed: true, due: () => tourLaterToday() },
];

function tourFromNow(minutes) {
  return toDatetimeValue(new Date(Date.now() + minutes * 60000));
}

// 11:59 PM today, or 20 minutes from now in the day's last half hour
function tourLaterToday() {
  const d = new Date();
  if (d.getHours() === 23 && d.getMinutes() >= 30) return tourFromNow(20);
  d.setHours(23, 59, 0, 0);
  return toDatetimeValue(d);
}

function addTourSamples() {
  TOUR_SAMPLES.forEach(sample => {
    tasks.push({
      id: `sample-${sample.key}`,
      name: t(`sample.${sample.key}`),
      datetime: sample.due(),
      label: sample.label,
      priority: sample.priority,
      completed: Boolean(sample.completed),
      sample: true,
      sampleKey: sample.key,
    });
  });
  updateOverdueTasks();
  applyFilterAndSearch();
}

// They fade out like deleted tasks
function removeTourSamples() {
  const ids = new Set(tasks.filter(task => task.sample).map(task => task.id));
  if (!ids.size) return;
  const before = listPositions();
  fadeOutRows(ids);
  tasks = tasks.filter(task => !task.sample);
  ids.forEach(id => {
    seenIds.delete(id);
    selectedIds.delete(id);
  });
  updateOverdueTasks();
  applyFilterAndSearch();
  slideIntoPlace(before);
  window.smartTasksChanged?.();
}

// ── Tour ──

const TOUR_GAP = 14;   // between the highlight and the card
const TOUR_EDGE = 12;  // between the card and the screen edges
const TOUR_PAD = 6;    // around the element; small ones grow to 44px

const tourModalBox = modalOverlay.querySelector('.modal');
const tourAsidePanel = document.getElementById('aside-panel');

let tourEl = null;
let tourCard, tourBody, tourContent, tourSpot, tourIcon, tourCount, tourTitle, tourText;
let tourBar, tourLive, tourBackBtn, tourNextBtn, tourNextText;
let tourIndex = 0;
// This run's steps (TOUR_STEPS without the AI ones when they are off)
let tourSteps = TOUR_STEPS;
// What the tour opened, changed or hid, to put back when it ends
let tourSaved = null;
let tourInert = [];
let tourFrame = 0;
let tourPlaced = '';

function buildTour() {
  tourEl = document.createElement('div');
  tourEl.className = 'tour';
  tourEl.innerHTML = `
    <div class="tour-spot"></div>
    <div class="tour-card" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-text">
      <span class="tour-arrow" aria-hidden="true"></span>
      <div class="tour-body">
        <div class="tour-content">
          <div class="tour-top">
            <span class="tour-icon" aria-hidden="true"></span>
            <span class="tour-count"></span>
          </div>
          <h2 class="tour-title" id="tour-title"></h2>
          <p class="tour-text" id="tour-text"></p>
        </div>
        <div class="tour-progress" aria-hidden="true"><div class="tour-progress-bar"></div></div>
        <div class="tour-actions">
          <button type="button" class="tour-skip" data-i18n="tour.skip"></button>
          <span class="tour-nav">
            <button type="button" class="btn-secondary tour-back">
              <i data-lucide="chevron-left" aria-hidden="true"></i><span data-i18n="tour.back"></span>
            </button>
            <button type="button" class="btn-main tour-next">
              <span class="tour-next-text"></span>
              <i class="tour-next-arrow" data-lucide="chevron-right" aria-hidden="true"></i>
              <i class="tour-next-done" data-lucide="check" aria-hidden="true"></i>
            </button>
          </span>
        </div>
      </div>
      <p class="sr-only" aria-live="polite"></p>
    </div>`;
  document.body.append(tourEl);

  const find = sel => tourEl.querySelector(sel);
  tourCard = find('.tour-card');
  tourBody = find('.tour-body');
  tourContent = find('.tour-content');
  tourSpot = find('.tour-spot');
  tourIcon = find('.tour-icon');
  tourCount = find('.tour-count');
  tourTitle = find('.tour-title');
  tourText = find('.tour-text');
  tourBar = find('.tour-progress-bar');
  tourLive = find('[aria-live]');
  tourBackBtn = find('.tour-back');
  tourNextBtn = find('.tour-next');
  tourNextText = find('.tour-next-text');
  lucide.createIcons({ root: tourEl });

  find('.tour-skip').addEventListener('click', () => endTour(false));
  tourBackBtn.addEventListener('click', () => tourGo(-1));
  tourNextBtn.addEventListener('click', () => tourGo(1));
  // A tap on the dimmed page nudges the card, which is where to answer
  tourEl.addEventListener('click', (e) => {
    if (tourCard.contains(e.target)) return;
    tourCard.classList.remove('nudge');
    void tourCard.offsetWidth;
    tourCard.classList.add('nudge');
  });
  tourCard.addEventListener('animationend', (e) => {
    if (e.target === tourCard) tourCard.classList.remove('nudge');
  });
  tourEl.addEventListener('animationend', (e) => {
    if (e.target === e.currentTarget && e.currentTarget.classList.contains('leaving')) e.currentTarget.remove();
  });
}

// opener gets focus back at the end (or the + button); samples adds the
// sample tasks when the list is empty
function runTour({ opener = null, samples = false } = {}) {
  if (tourEl) return;
  hideToast();
  if (smartOverlay.classList.contains('active')) closeSmartDialog();
  if (welcomeOverlay.classList.contains('active')) closeWelcome(false);
  closeHelp(false);
  tourSaved = {
    opener,
    scroll: window.scrollY,
    aside: asideOverlay.classList.contains('active'),
    asideScroll: tourAsidePanel.scrollTop,
    modalScroll: tourModalBox.scrollTop,
    filterBar: filterBar.classList.contains('active'),
    searchBar: searchBar.classList.contains('active'),
    selection: [...selectedIds],
    filters: null,
  };
  if (modalOverlay.classList.contains('active')) closeModal();

  buildTour();
  // The page under the tour can't be clicked or focused, so focus stays
  // in the card and the panels the tour opens don't take it
  tourInert = [...document.body.children].filter(el => el !== tourEl && el.tagName !== 'SCRIPT' && !el.inert);
  tourInert.forEach(el => { el.inert = true; });
  // The header stops being sticky (style.css), so a step's element can
  // scroll right to the top and leave the card room below it
  document.documentElement.classList.add('touring');
  document.documentElement.style.scrollPaddingTop = `${TOUR_EDGE}px`;

  if (samples && !tasks.length) addTourSamples();
  window.addEventListener('keydown', tourKeydown, true);
  tourPlaced = '';
  tourIndex = 0;
  // AI steps need AI features on and ai.js loaded
  const aiReady = localStorage.getItem('ai') === 'on' && document.getElementById('ai-suggest');
  tourSteps = TOUR_STEPS.filter(step => !step.ai || aiReady);
  showTourStep(0);
  tourNextBtn.focus();
  tourFollow();
}

function showTourStep(index) {
  const swap = tourIndex !== index;
  const focused = document.activeElement;
  tourIndex = index;
  applyTourState(tourSteps[index]);
  renderTourCard(swap);
  // Closing a panel can move focus; it stays on the card's button
  if (tourCard.contains(focused) && !focused.disabled) focused.focus();
  else tourNextBtn.focus();
  // Panels just opened have their size a frame later
  requestAnimationFrame(() => {
    if (tourEl && tourIndex === index) tourReveal();
  });
}

function tourGo(delta) {
  const index = tourIndex + delta;
  if (index < 0) return;
  if (index >= tourSteps.length) endTour(true);
  else showTourStep(index);
}

// Opens or closes what the step needs; anything the step doesn't need goes
// back the way the user had it
function applyTourState(step) {
  const modalOpen = modalOverlay.classList.contains('active');
  if (step.modal && !modalOpen) openModal();
  if (!step.modal && modalOpen) closeModal();
  const asideOpen = asideOverlay.classList.contains('active');
  if (step.aside && !asideOpen) openAside();
  if (!step.aside && asideOpen) closeAside();
  filterBar.classList.toggle('active', Boolean(step.filters) || tourSaved.filterBar);
  searchBar.classList.toggle('active', Boolean(step.search) || tourSaved.searchBar);

  if (step.list) tourShowAll();
  else tourPutBackFilters();
  const demo = step.select && tourRow('open');
  tourSelect(demo && demo.dataset.id ? [demo.dataset.id] : tourSaved.selection);
}

// List steps show every task: a status, label or priority filter and the
// search text are set aside for them
function tourShowAll() {
  if (tourSaved.filters) return;
  const filters = { status: currentFilter, label: filterLabel.value, priority: filterPriority.value, query: searchInput.value };
  if (filters.status === 'all' && filters.label === 'all' && filters.priority === 'all' && !filters.query) return;
  tourSaved.filters = filters;
  tourSetFilters({ status: 'all', label: 'all', priority: 'all', query: '' });
}

function tourPutBackFilters() {
  if (!tourSaved.filters) return;
  tourSetFilters(tourSaved.filters);
  tourSaved.filters = null;
}

// Same steps as the filter buttons, dropdowns and search field
function tourSetFilters({ status, label, priority, query }) {
  currentFilter = status;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.filter === status));
  moveIndicator(document.querySelector('.status-filter'));
  // A label no task uses any more is only in the list while selected
  if (![...filterLabel.options].some(option => option.value === label)) filterLabel.add(new Option(label, label));
  filterLabel.value = label;
  filterPriority.value = priority;
  searchInput.value = query;
  updateClearButton();
  applyFilterAndSearch();
}

// Selects tasks without redrawing the list
function tourSelect(ids) {
  selectedIds = new Set(ids);
  taskListEl.querySelectorAll('.task-row').forEach(row => {
    row.classList.toggle('selected', selectedIds.has(row.dataset.id));
  });
  updateActionButtons();
}

function renderTourCard(swap = false) {
  if (!tourEl) return;
  const step = tourSteps[tourIndex];
  const total = tourSteps.length;
  const last = tourIndex === total - 1;
  tourEl.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  tourEl.querySelector('.tour-skip').setAttribute('aria-label', t('tour.skipLabel'));
  tourCount.textContent = t('tour.step', { n: tourIndex + 1, total });
  tourTitle.textContent = t(`guide.${step.id}.title`);
  tourText.textContent = guideText(step.id);
  tourNextText.textContent = t(last ? 'tour.finish' : 'tour.next');
  tourNextBtn.querySelector('.tour-next-arrow').toggleAttribute('hidden', last);
  tourNextBtn.querySelector('.tour-next-done').toggleAttribute('hidden', !last);
  tourBackBtn.disabled = tourIndex === 0;
  tourBar.style.width = `${(tourIndex + 1) / total * 100}%`;
  if (tourIcon.dataset.icon !== step.icon) {
    tourIcon.dataset.icon = step.icon;
    tourIcon.innerHTML = `<i data-lucide="${step.icon}"></i>`;
    lucide.createIcons({ root: tourIcon });
  }
  tourLive.textContent = `${tourCount.textContent}. ${tourTitle.textContent}. ${tourText.textContent}`;
  if (swap) {
    tourContent.classList.remove('tour-swap');
    void tourContent.offsetWidth;
    tourContent.classList.add('tour-swap');
  }
}

function tourTargets() {
  const found = tourSteps[tourIndex].target();
  return (Array.isArray(found) ? found : [found]).filter(el => el && el.isConnected);
}

// The box around the step's elements that are drawn, or null
function tourBox(els) {
  let box = null;
  els.forEach(el => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    box = box
      ? { left: Math.min(box.left, r.left), top: Math.min(box.top, r.top),
        right: Math.max(box.right, r.right), bottom: Math.max(box.bottom, r.bottom) }
      : { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
  });
  return box;
}

// Scrolls the element into view when it is off screen or leaves no room
// for the card: the page, or the dialog and side menu inside their own
// scroll area
function tourReveal() {
  const els = tourTargets();
  const box = tourBox(els);
  if (!els.length) return;
  const panel = els[0].closest('.modal, .aside');
  const area = panel ? panel.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
  // The card's full height, not the room it was squeezed into last step
  tourBody.style.maxHeight = '';
  const need = tourCard.offsetHeight + TOUR_GAP + TOUR_EDGE;
  const shown = box && box.top >= area.top && box.bottom <= area.bottom;
  const room = box && (window.innerHeight - box.bottom >= need || box.top >= need);
  if (!shown || !room) els[0].scrollIntoView({ block: 'start' });
}

// Keeps the highlight and card on the element while it moves (panels
// sliding in, scrolling, resizing, the list redrawing)
function tourFollow() {
  tourFrame = requestAnimationFrame(tourFollow);
  placeTour();
}

const tourClamp = (value, min, max) => Math.min(Math.max(value, min), max);

// The card goes below the element, else above, else beside it on the end
// side, then the start side, so it never covers the element or leaves the
// screen. Its arrow points at the element's centre.
function placeTour() {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const els = tourTargets();
  const box = tourBox(els);
  // Off screen (the side menu sliding in, or not scrolled to yet): wait for it
  if (box && (box.right <= 0 || box.left >= vw || box.bottom <= 0 || box.top >= vh)) return;
  const cardW = Math.min(360, vw - TOUR_EDGE * 2);
  const key = [box ? [box.left, box.top, box.right, box.bottom].map(Math.round).join() : '',
    vw, vh, tourIndex, tourContent.scrollHeight, document.documentElement.dir].join('|');
  if (key === tourPlaced) return;
  const first = tourPlaced === '';
  tourPlaced = key;

  tourCard.style.width = `${cardW}px`;
  tourBody.style.maxHeight = '';
  let spot;
  let side = 'none';
  let x;
  let y;
  let arrow = 0;
  if (!box) {
    // Nothing drawn to point at: the whole page dims and the card waits in the middle
    spot = { left: vw / 2, top: vh / 2, right: vw / 2, bottom: vh / 2 };
    x = (vw - cardW) / 2;
    y = Math.max(TOUR_EDGE, (vh - tourCard.offsetHeight) / 2);
  } else {
    const padX = Math.max(TOUR_PAD, (44 - (box.right - box.left)) / 2);
    const padY = Math.max(TOUR_PAD, (44 - (box.bottom - box.top)) / 2);
    spot = {
      left: Math.max(2, box.left - padX), top: Math.max(2, box.top - padY),
      right: Math.min(vw - 2, box.right + padX), bottom: Math.min(vh - 2, box.bottom + padY),
    };
    const cardH = tourCard.offsetHeight;
    const room = {
      below: vh - spot.bottom - TOUR_GAP - TOUR_EDGE,
      above: spot.top - TOUR_GAP - TOUR_EDGE,
      right: vw - spot.right - TOUR_GAP - TOUR_EDGE,
      left: spot.left - TOUR_GAP - TOUR_EDGE,
    };
    const rtl = document.documentElement.dir === 'rtl';
    side = ['below', 'above', rtl ? 'left' : 'right', rtl ? 'right' : 'left'].find(s => (s === 'below' || s === 'above')
      ? room[s] >= cardH
      : room[s] >= cardW && vh - TOUR_EDGE * 2 >= cardH);
    if (!side) {
      // Little room anywhere: the larger gap, where the text scrolls and
      // the buttons stay in view
      side = room.below >= room.above ? 'below' : 'above';
      tourBody.style.maxHeight = `${Math.max(room[side], 200) - 2}px`;
    }
    const height = tourCard.offsetHeight;
    const cx = (spot.left + spot.right) / 2;
    const cy = (spot.top + spot.bottom) / 2;
    if (side === 'below' || side === 'above') {
      x = tourClamp(cx - cardW / 2, TOUR_EDGE, vw - TOUR_EDGE - cardW);
      y = side === 'below' ? spot.bottom + TOUR_GAP : spot.top - TOUR_GAP - height;
      arrow = tourClamp(cx - x, 22, cardW - 22);
    } else {
      x = side === 'right' ? spot.right + TOUR_GAP : spot.left - TOUR_GAP - cardW;
      y = tourClamp(cy - height / 2, TOUR_EDGE, vh - TOUR_EDGE - height);
      arrow = tourClamp(cy - y, 22, height - 22);
    }
  }

  // Round things get a round highlight, cards and rows a rounded one
  const radius = els.length === 1 ? parseFloat(getComputedStyle(els[0]).borderTopLeftRadius) || 0 : 0;
  // The first placement jumps there; later ones glide
  if (first) tourEl.classList.add('tour-instant');
  tourSpot.style.transform = `translate(${spot.left}px, ${spot.top}px)`;
  tourSpot.style.width = `${spot.right - spot.left}px`;
  tourSpot.style.height = `${spot.bottom - spot.top}px`;
  tourSpot.style.borderRadius = `${Math.max(10, radius + TOUR_PAD)}px`;
  tourSpot.classList.toggle('empty', !box);
  tourCard.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  tourCard.dataset.side = side;
  tourCard.style.setProperty('--arrow', `${Math.round(arrow)}px`);
  if (first) {
    tourEl.getBoundingClientRect();
    tourEl.classList.remove('tour-instant');
  }
}

// Arrow keys move through the steps (mirrored in Arabic), Enter goes on,
// Esc ends the tour, Tab stays in the card. The app's own shortcuts wait.
function tourKeydown(e) {
  if (!tourEl) return;
  e.stopPropagation();
  if (e.key === 'Tab') {
    trapTab(e, tourCard);
    return;
  }
  const rtl = document.documentElement.dir === 'rtl';
  let action = null;
  if (e.key === 'Escape') action = () => endTour(false);
  else if (e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) action = () => tourGo(1);
  else if (e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) action = () => tourGo(-1);
  // On a button Enter presses that button
  else if (e.key === 'Enter' && !e.target.closest('button')) action = () => tourGo(1);
  if (!action) return;
  e.preventDefault();
  if (!e.repeat) action();
}

// Puts the page back as it was: panels, filters, search, selection,
// scroll position and the user's own tasks without the samples
function endTour(finished) {
  if (!tourEl) return;
  window.removeEventListener('keydown', tourKeydown, true);
  cancelAnimationFrame(tourFrame);
  const saved = tourSaved;
  const layer = tourEl;
  tourEl = null;

  tourInert.forEach(el => { el.inert = false; });
  tourInert = [];
  document.documentElement.classList.remove('touring');
  document.documentElement.style.scrollPaddingTop = '';

  if (modalOverlay.classList.contains('active')) closeModal();
  tourModalBox.scrollTop = saved.modalScroll;
  selectedIds = new Set(saved.selection);
  tourPutBackFilters();
  filterBar.classList.toggle('active', saved.filterBar);
  searchBar.classList.toggle('active', saved.searchBar);
  removeTourSamples();
  tourSelect([...selectedIds]);
  window.scrollTo({ top: saved.scroll, behavior: 'instant' });

  const asideOpen = asideOverlay.classList.contains('active');
  if (saved.aside && !asideOpen) openAside();
  if (!saved.aside && asideOpen) closeAside();
  tourAsidePanel.scrollTop = saved.asideScroll;

  if (reducedMotion.matches) layer.remove();
  else layer.classList.add('leaving');
  localStorage.setItem('tour', finished ? 'done' : 'skipped');
  showToast(() => t(finished ? 'tour.finished' : 'tour.later'));
  restoreFocus(saved.opener, btnAdd);
}

// ── Help ──

// The tour's explanations as topics (the shortcuts get their own list)
const HELP_TOPICS = TOUR_STEPS.filter(step => step.id !== 'shortcuts' && step.id !== 'help');
const HELP_TIPS = ['select', 'locked', 'new', 'undo', 'label', 'reload', 'backup'];
// Keys (written as is, or a name from i18n.js) and what they do
const HELP_KEYS = [
  [['N'], 'shortcut.new'],
  [['Enter'], 'shortcut.save'],
  [['Esc'], 'shortcut.close'],
  [['help.key.arrows'], 'help.key.calendar'],
  [['Page Up', 'Page Down'], 'help.key.month'],
  [['help.key.back', 'help.key.next'], 'help.key.tour'],
];

let helpEl = null;
let helpDialog, helpInput, helpClear, helpNone, helpClose;
let helpOpener = null;

function buildHelp() {
  const kbd = key => key.startsWith('help.') ? `<kbd data-i18n="${key}"></kbd>` : `<kbd>${key}</kbd>`;
  helpEl = document.createElement('div');
  helpEl.className = 'modal-overlay help-overlay';
  helpEl.innerHTML = `
    <div class="modal help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title">
      <div class="help-top">
        <div class="modal-header">
          <h2 class="modal-title" id="help-title" data-i18n="help.title"></h2>
          <button type="button" class="icon-btn help-close" data-i18n-title="modal.close" data-i18n-aria-label="modal.close">
            <i data-lucide="x"></i>
          </button>
        </div>
        <div class="help-search">
          <i data-lucide="search" aria-hidden="true"></i>
          <input type="text" class="help-input" dir="auto" autocomplete="off" data-i18n-placeholder="help.search" data-i18n-aria-label="help.search" />
          <button type="button" class="icon-btn help-clear" data-i18n-title="search.clear" data-i18n-aria-label="search.clear" hidden>
            <i data-lucide="circle-x"></i>
          </button>
        </div>
      </div>
      <button type="button" class="btn-main help-tour">
        <i data-lucide="route" aria-hidden="true"></i><span data-i18n="welcome.start"></span>
      </button>
      <section class="help-section" aria-labelledby="help-tips-title">
        <h3 class="help-heading" id="help-tips-title" data-i18n="help.tips"></h3>
        <ul class="help-tips">
          ${HELP_TIPS.map(key => `<li class="help-match"><i data-lucide="lightbulb" aria-hidden="true"></i><span data-i18n="help.tip.${key}"></span></li>`).join('')}
        </ul>
      </section>
      <section class="help-section" aria-labelledby="help-topics-title">
        <h3 class="help-heading" id="help-topics-title" data-i18n="help.topics"></h3>
        ${HELP_TOPICS.map(step => `
          <article class="help-topic help-match" data-topic="${step.id}">
            <span class="help-topic-icon" aria-hidden="true"><i data-lucide="${step.icon}"></i></span>
            <div class="help-topic-body">
              <h4 class="help-topic-title" data-i18n="guide.${step.id}.title"></h4>
              <p class="help-topic-text"></p>
            </div>
          </article>`).join('')}
      </section>
      <section class="help-section" aria-labelledby="help-keys-title">
        <h3 class="help-heading" id="help-keys-title" data-i18n="help.keys"></h3>
        <dl class="help-keys">
          ${HELP_KEYS.map(([keys, action]) => `
            <div class="help-key help-match">
              <dt>${keys.map(kbd).join(' ')}</dt>
              <dd data-i18n="${action}"></dd>
            </div>`).join('')}
        </dl>
      </section>
      <p class="help-none" hidden></p>
    </div>`;
  document.body.append(helpEl);

  helpDialog = helpEl.querySelector('.help-dialog');
  helpInput = helpEl.querySelector('.help-input');
  helpClear = helpEl.querySelector('.help-clear');
  helpNone = helpEl.querySelector('.help-none');
  helpClose = helpEl.querySelector('.help-close');
  translatePage();
  lucide.createIcons({ root: helpEl });

  helpClose.addEventListener('click', () => closeHelp());
  helpEl.addEventListener('click', (e) => {
    if (e.target === helpEl) closeHelp();
  });
  helpEl.addEventListener('animationend', endLeave);
  helpInput.addEventListener('input', filterHelp);
  helpClear.addEventListener('click', () => {
    helpInput.value = '';
    filterHelp();
    helpInput.focus();
  });
  helpEl.querySelector('.help-tour').addEventListener('click', () => {
    closeHelp(false);
    takeTour(helpOpener);
  });
}

// Texts with numbers, which data-i18n can't fill
function renderHelp() {
  if (!helpEl) return;
  helpEl.querySelectorAll('.help-topic').forEach(topic => {
    topic.querySelector('.help-topic-text').textContent = guideText(topic.dataset.topic);
  });
  filterHelp();
}

// Shows the tips, topics and keys that have every word typed, matched the
// same way as task search (case, Arabic vowel marks and letter forms)
function filterHelp() {
  const words = normalizeSearchText(helpInput.value).split(' ').filter(Boolean);
  let found = 0;
  helpEl.querySelectorAll('.help-section').forEach(section => {
    let any = false;
    section.querySelectorAll('.help-match').forEach(item => {
      const text = normalizeSearchText(item.textContent);
      const match = words.every(word => text.includes(word));
      item.hidden = !match;
      any = any || match;
    });
    section.hidden = !any;
    if (any) found++;
  });
  helpNone.hidden = found > 0;
  helpNone.textContent = t('help.none');
  helpClear.hidden = !helpInput.value;
}

// topic: a topic to scroll to and light up (the side menu's Install row)
function openHelp(opener, topic) {
  if (!helpEl) buildHelp();
  helpOpener = opener;
  helpInput.value = '';
  renderHelp();
  helpEl.classList.remove('leaving');
  helpEl.classList.add('active');
  window.addEventListener('keydown', helpKeydown, true);
  helpDialog.scrollTop = 0;
  const item = topic && helpEl.querySelector(`[data-topic="${topic}"]`);
  if (item) {
    item.scrollIntoView({ block: 'center' });
    item.classList.remove('help-flash');
    void item.offsetWidth;
    item.classList.add('help-flash');
  }
  // With a mouse the search box gets focus; on a touch screen the close
  // button does, so no keyboard pops up
  (!item && matchMedia('(pointer: fine)').matches ? helpInput : helpClose).focus();
}

function closeHelp(returnFocus = true) {
  if (!helpEl || !helpEl.classList.contains('active')) return;
  window.removeEventListener('keydown', helpKeydown, true);
  helpEl.classList.remove('active');
  playLeave(helpEl);
  if (returnFocus) restoreFocus(helpOpener, btnMenu);
}

// Esc closes Help (not the side menu under it), Tab stays inside
function helpKeydown(e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    closeHelp();
  } else if (e.key === 'Tab') {
    trapTab(e, helpDialog);
  }
}

// Called by app.js after a language switch
function renderGuide() {
  tasks.forEach(task => {
    if (task.sample) task.name = t(`sample.${task.sampleKey}`);
  });
  renderTourCard();
  renderHelp();
}
