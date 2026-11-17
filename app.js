// ─── DATA ────────────────────────────────────────────

let tasks = [];

function loadTasks() {
  const stored = localStorage.getItem('tasks');
  const parsed = stored ? JSON.parse(stored) : [];
  tasks = parsed.map(t => ({
    ...t,
    completed: t.completed ?? false
  }));
}

function saveTasks() {
  // Sample tasks shown during the tour (tour.js) are never saved
  localStorage.setItem('tasks', JSON.stringify(tasks.filter(task => !task.sample)));
  // Keeps smart search's stored task vectors in step (semantic.js). The
  // smart* calls do nothing until that file has loaded.
  window.smartTasksChanged?.();
}

// Random UUID, with a fallback where crypto.randomUUID is missing (old
// browsers, plain http). Older tasks keep their numeric string ids.
function generateId() {
  if (window.crypto && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36)
    + Math.random().toString(36).slice(2, 10)
    + Math.random().toString(36).slice(2, 10);
}

// ─── RENDER ──────────────────────────────────────────

const taskListEl = document.getElementById('task-list');
const emptyStateEl = document.getElementById('empty-state');

let selectedIds = new Set();
let currentSort = localStorage.getItem('sort') || 'deadline';

// Order the groups appear in the list (titles come from i18n.js)
const GROUPS = ['overdue', 'today', 'upcoming', 'completed'];
const GROUP_ICONS = {
  overdue: 'alarm-clock', today: 'sun', upcoming: 'calendar-days', completed: 'circle-check',
  related: 'sparkles',
};

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Tasks already shown once. Only first load and new tasks animate in, so
// redrawing the list (30 s refresh, selection, filters, sort, language)
// never replays the entrance.
const seenIds = new Set();
let firstRender = true;
// Checkbox that was just ticked (it pops once) and the last group counts
// (a badge pops when its count changes)
let poppedId = null;
let lastCounts = {};
// Tasks shown last time as meaning matches; newly found ones fade in
let lastRelated = new Set();

function isLocked(task) {
  return new Date(task.datetime) <= new Date();
}

// Overdue is derived, never stored: deadline passed and not completed.
function isOverdue(task) {
  return !task.completed && isLocked(task);
}

function getStatus(task) {
  if (task.completed) return t('status.completed');
  return t(isOverdue(task) ? 'status.overdue' : 'status.active');
}

function isDueToday(task) {
  return new Date(task.datetime).toDateString() === new Date().toDateString();
}

function getGroup(task) {
  if (task.completed) return 'completed';
  if (isOverdue(task)) return 'overdue';
  return isDueToday(task) ? 'today' : 'upcoming';
}

// Tasks without a valid date sort last
function getTime(task) {
  const time = new Date(task.datetime).getTime();
  return Number.isNaN(time) ? Infinity : time;
}

// Soonest deadline first. Priority sort uses deadline as the tie-break.
function compareTasks(a, b) {
  if (currentSort === 'priority') {
    const diff = (PRIORITY_RANK[a.priority] ?? 3) - (PRIORITY_RANK[b.priority] ?? 3);
    if (diff !== 0) return diff;
  }
  return getTime(a) - getTime(b) || 0;
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// related: smart search's meaning matches, shown after the others
function renderTasks(filtered = tasks, related = []) {
  taskListEl.innerHTML = '';
  const counts = {};
  // Stagger position; on first load the header and band come first
  let order = firstRender ? 3 : 0;

  if (filtered.length === 0 && related.length === 0) {
    emptyStateEl.querySelector('p').textContent = t(tasks.length ? 'empty.filtered' : 'empty.none');
    // Smart search may still find some by meaning
    emptyStateEl.style.display = window.smartWaiting?.() ? 'none' : 'block';
  } else {
    emptyStateEl.style.display = 'none';
  }

  GROUPS.forEach(group => {
    const groupTasks = filtered
      .filter(task => getGroup(task) === group)
      .sort(compareTasks);
    order = renderGroup(group, groupTasks, counts, order);
  });
  // Meaning matches keep their closest-first order
  renderGroup('related', related, counts, order);

  // Only the list's icons: redrawing the header's would restart their hover motion
  lucide.createIcons({ root: taskListEl });
  tasks.forEach(task => seenIds.add(task.id));
  firstRender = false;
  poppedId = null;
  lastCounts = counts;
  lastRelated = new Set(related.map(task => task.id));
}

// One header per group, only for groups that have tasks. The icon comes
// last in the markup (CSS shows it first), so the title stays firstChild.
function renderGroup(group, groupTasks, counts, order) {
  if (groupTasks.length === 0) return order;
  const related = group === 'related';
  counts[group] = groupTasks.length;
  const pop = lastCounts[group] !== undefined && lastCounts[group] !== groupTasks.length;

  const header = document.createElement('h2');
  header.className = `group-header group-${group}`;
  header.dataset.group = group;
  header.innerHTML = `${t(`group.${group}`)} <span class="group-count${pop ? ' pop' : ''}">${formatDigits(groupTasks.length)}</span>`
    + `<i data-lucide="${GROUP_ICONS[group]}" aria-hidden="true"></i>`;
  if (firstRender) enter(header, order++);
  else if (related && lastRelated.size === 0) header.classList.add('fade-in');
  taskListEl.appendChild(header);

  groupTasks.forEach(task => {
    const row = renderTaskRow(task, related);
    if (!seenIds.has(task.id)) enter(row, order++);
    else if (related && !lastRelated.has(task.id)) row.classList.add('fade-in');
    taskListEl.appendChild(row);
  });
  return order;
}

function enter(el, order) {
  el.classList.add('enter');
  el.style.setProperty('--i', Math.min(order, 12));
}

taskListEl.addEventListener('animationend', (e) => {
  if (e.animationName === 'rise-in') e.target.classList.remove('enter');
  if (e.animationName === 'fade-rise') e.target.classList.remove('fade-in');
});

function renderTaskRow(task, related = false) {
  const row = document.createElement('div');
  const locked = isLocked(task);
  const overdue = isOverdue(task);

  row.className = 'task-row'
    + (task.completed ? ' completed' : '')
    + (overdue ? ' overdue' : '')
    + (selectedIds.has(task.id) ? ' selected' : '');
  row.dataset.id = task.id;

  // dir="auto" lets an English or Arabic name read in its own direction
  const priorityTitle = PRIORITY_RANK[task.priority] === undefined ? '' : t(`priorityDot.${task.priority}`);
  // A small sparkle says why a meaning match is in the results
  const relatedHint = related
    ? `<span class="task-related" title="${t('task.related')}"><i data-lucide="sparkles" aria-hidden="true"></i><span class="sr-only">${t('task.related')}</span></span>`
    : '';
  const sampleTag = task.sample ? `<span class="task-sample">${t('sample.tag')}</span>` : '';
  row.innerHTML = `
    <div class="task-info">
      ${relatedHint}
      <span class="task-name" dir="auto">${escapeHTML(task.name)}</span>
      ${sampleTag}
      <span class="task-date" title="${formatFullDate(task.datetime)}">${formatDate(task.datetime)}</span>
      <span class="task-relative${overdue ? ' task-overdue' : ''}" title="${formatFullDate(task.datetime)}">${formatRelative(task)}</span>
      <span class="task-label" dir="auto">
        <i data-lucide="${LABEL_ICONS[task.label] || 'tag'}" aria-hidden="true"></i>
        <span class="task-label-text">${escapeHTML(labelName(task.label))}</span>
      </span>
      <span class="task-priority priority-${task.priority}" role="img" title="${priorityTitle}" aria-label="${priorityTitle}"><span></span><span></span><span></span></span>
    </div>
    <input type="checkbox" class="task-checkbox${task.id === poppedId ? ' pop' : ''}" aria-label="${escapeHTML(t('task.markDone', { name: task.name }))}"
      ${task.completed ? 'checked' : ''} ${locked ? `disabled title="${t('task.locked')}"` : ''} />
  `;

  return row;
}

// Dates and times are built from the names in i18n.js, so they look the
// same whatever the browser's region: "17 Oct 2026, 3:00 PM" or
// "17 أكتوبر 2026، 3:00 م"

const pad = n => String(n).padStart(2, '0');

// 12-hour clock: 0:05 is "12:05 AM", 12:00 is "12:00 PM"
function formatClock(hours, minutes) {
  return t('time.clock', {
    hours: hours % 12 || 12,
    minutes: formatDigits(pad(minutes)),
    period: t(hours < 12 ? 'time.am' : 'time.pm'),
  });
}

// "Saturday, 17 October 2026"
function formatLongDate(d) {
  const names = dateNames();
  return t('date.long', {
    weekday: names.days[d.getDay()], day: d.getDate(),
    month: names.months[d.getMonth()], year: d.getFullYear(),
  });
}

function formatDate(datetime) {
  if (!datetime) return '';
  const d = new Date(datetime);
  if (Number.isNaN(d.getTime())) return '';
  const names = dateNames();
  return t('date.short', {
    day: names.padDay ? formatDigits(pad(d.getDate())) : d.getDate(),
    month: names.monthsShort[d.getMonth()], year: d.getFullYear(),
    time: formatClock(d.getHours(), d.getMinutes()),
  });
}

// Exact timestamp for the tooltip
function formatFullDate(datetime) {
  if (!datetime || Number.isNaN(new Date(datetime).getTime())) return '';
  const d = new Date(datetime);
  return t('date.full', { date: formatLongDate(d), time: formatClock(d.getHours(), d.getMinutes()) });
}

// Short label like "in 2 h", "in 3 days" or "overdue by 1 day"
function formatRelative(task) {
  const time = getTime(task);
  if (time === Infinity) return '';

  // Rounded to the nearest unit, so 5 h 50 min reads "6 h"
  const diff = time - Date.now();
  const minutes = Math.round(Math.abs(diff) / 60000);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  let amount;
  if (minutes < 1) amount = t('rel.lessThanMinute');
  else if (minutes < 60) amount = t('unit.minute', { count: minutes });
  else if (hours < 24) amount = t('unit.hour', { count: hours });
  else amount = t('unit.day', { count: days });

  if (diff > 0) return t('rel.in', { amount });
  return t(isOverdue(task) ? 'rel.overdue' : 'rel.ago', { amount });
}

// Updates the relative labels in place, so selection and hover stay put
function refreshRelativeTimes() {
  taskListEl.querySelectorAll('.task-row').forEach(row => {
    const task = tasks.find(t => t.id === row.dataset.id);
    if (task) row.querySelector('.task-relative').textContent = formatRelative(task);
  });
}

// Built-in labels are stored as English ids and shown translated; custom
// labels are shown exactly as typed
const BUILT_IN_LABELS = ['university', 'work', 'personal', 'health', 'other'];

function labelName(label) {
  return BUILT_IN_LABELS.includes(label) ? t(`label.${label}`) : label;
}

// Labels share one main-tinted pill and differ by icon; custom labels get a tag
const LABEL_ICONS = {
  university: 'graduation-cap',
  work:       'briefcase',
  personal:   'user',
  health:     'heart-pulse',
};

// ─── SLIDING INDICATORS ──────────────────────────────

// Segmented controls (status filter, sort, AM/PM) have a pill that slides
// to the active item. Its offset is measured from the start side, so it
// slides the mirrored way in Arabic.
const segmentedGroups = document.querySelectorAll('.segmented');

function moveIndicator(group) {
  const active = group.querySelector('.active, [aria-pressed="true"]');
  if (!active || !group.clientWidth) return;
  const start = document.documentElement.dir === 'rtl'
    ? group.clientWidth - active.offsetLeft - active.offsetWidth
    : active.offsetLeft;
  // The first placement jumps there; later ones slide
  const first = !group.style.getPropertyValue('--seg-width');
  if (first) group.classList.add('seg-instant');
  group.style.setProperty('--seg-start', `${start}px`);
  group.style.setProperty('--seg-width', `${active.offsetWidth}px`);
  if (first) {
    group.getBoundingClientRect();
    group.classList.remove('seg-instant');
  }
}

function updateIndicators() {
  segmentedGroups.forEach(moveIndicator);
}

// Sizes change when a bar opens, the language changes or fonts load
const indicatorObserver = new ResizeObserver(entries => {
  new Set(entries.map(entry => entry.target.closest('.segmented'))).forEach(moveIndicator);
});
segmentedGroups.forEach(group => {
  indicatorObserver.observe(group);
  group.querySelectorAll('.seg-btn').forEach(btn => indicatorObserver.observe(btn));
});

// ─── MODAL ───────────────────────────────────────────

const modalOverlay      = document.getElementById('modal-overlay');
const modalTitle        = document.getElementById('modal-title');
const inputName         = document.getElementById('input-name');
const inputDate         = document.getElementById('input-date');
const inputTime         = document.getElementById('input-time');
const deadlineSummary   = document.getElementById('deadline-summary');
const deadlineWarning   = document.getElementById('deadline-warning');
const deadlineError     = document.getElementById('deadline-error');
const inputLabel        = document.getElementById('input-label');
const inputCustomLabel  = document.getElementById('input-custom-label');
const customLabelGroup  = document.getElementById('custom-label-group');
const inputPriority     = document.getElementById('input-priority');
const btnAdd            = document.getElementById('btn-add');

let editingId = null;
let editingCompleted = false;
let modalOpener = null;

// Puts focus back on an element, or on the fallback if that element is
// gone, hidden or disabled
function restoreFocus(el, fallback) {
  const usable = el && el !== document.body && el.isConnected
    && !el.disabled && el.offsetParent !== null;
  (usable ? el : fallback).focus();
}

// ── Deadline input ──
// Tasks store the deadline as a local "YYYY-MM-DDTHH:mm" string (24-hour).
// The modal shows it as a DD/MM/YYYY date field and a 12-hour time field
// with AM/PM buttons.

const inputDateWrap = document.getElementById('date-wrap');
const btnCalendar   = document.getElementById('btn-calendar');
const calendar      = document.getElementById('calendar');
const calTitle      = document.getElementById('cal-title');
const calHead       = document.getElementById('cal-head');
const calBody       = document.getElementById('cal-body');
const ampmButtons   = document.querySelectorAll('[data-period]');

// AM or PM for a typed hour from 1 to 12 without AM/PM
let timePeriod = 'AM';
// Day the calendar is showing and has keyboard focus on, "YYYY-MM-DD"
let calFocus = '';
// Builds the visible deadline error in the current language, or null
let deadlineErrorText = null;

function toDateValue(d) {
  return `${String(d.getFullYear()).padStart(4, '0')}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toDatetimeValue(d) {
  return `${toDateValue(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// "YYYY-MM-DD" to "DD/MM/YYYY"
function toDateText(value) {
  const [year, month, day] = value.split('-');
  return formatDigits(`${day}/${month}/${year}`);
}

// "HH:MM" (24-hour) to "3:00 PM"
function toTimeText(value) {
  const [hours, minutes] = value.split(':').map(Number);
  return formatClock(hours, minutes);
}

// Text for the time field, which stays left to right. In Arabic it holds
// only "3:00": a ص/م typed after it would land on the wrong side for a
// right-to-left reader, and the ص/م buttons beside it already show it.
function toTimeFieldText(value) {
  if (currentLang !== 'ar') return toTimeText(value);
  const [hours, minutes] = value.split(':').map(Number);
  return formatDigits(`${hours % 12 || 12}:${pad(minutes)}`);
}

// Reads DD/MM/YYYY, also 1/2/2026, 1-2-2026, 1.2.2026, 01022026 and
// Arabic-Indic digits. Returns { date: "YYYY-MM-DD" }, { error } (a
// function that gives the message in the current language) or null.
function parseDateText(text) {
  const value = normalizeDigits(text).trim();
  if (!value) return null;
  const m = value.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/) || value.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (!m) return { error: () => t('error.dateFormat') };
  const [day, month, year] = m.slice(1, 4).map(Number);
  if (year < 1900) return { error: () => t('error.year', { min: 1900 }) };
  if (month < 1 || month > 12) {
    return { error: () => t('error.month', { from: formatDigits('01'), to: 12 }) };
  }
  const days = new Date(year, month, 0).getDate();
  if (day < 1 || day > days) {
    return { error: () => t('error.day', {
      from: formatDigits('01'), to: days, month: dateNames().months[month - 1], year,
    }) };
  }
  return { date: `${year}-${pad(month)}-${pad(day)}` };
}

// Reads 2:30pm, 2:30 PM, 230pm, 2.30 pm, 9am, 14:30, Arabic-Indic digits
// and ص/م for AM/PM. Without AM/PM an hour from 1 to 12 uses the selected
// AM/PM button, while 0 and 13 to 23 are read as 24-hour.
// Returns { time: "HH:MM" (24-hour), period } or null.
function parseTime(text, period = timePeriod) {
  const value = normalizeDigits(text).toLowerCase().replace(/\s+/g, '')
    .replace(/(صباحًا|صباحاً|صباحا|ص)$/, 'am').replace(/(مساءً|مساءا|مساء|م)$/, 'pm')
    .replace(/a\.?m?\.?$/, 'am').replace(/p\.?m?\.?$/, 'pm')
    .replace(/[.,٫،]/, ':');
  const m = value.match(/^(\d{1,2})(?::(\d{2})|(\d{2}))?(am|pm)?$/);
  if (!m) return null;
  const hours = Number(m[1]);
  const minutes = Number(m[2] ?? m[3] ?? 0);
  if (minutes > 59) return null;

  if (m[4]) {
    if (hours < 1 || hours > 12) return null;
    period = m[4].toUpperCase();
  } else if (hours === 0 || hours > 12) {
    if (hours > 23) return null;
    return { time: `${pad(hours)}:${pad(minutes)}`, period: hours < 12 ? 'AM' : 'PM' };
  }

  // 12 AM is midnight and 12 PM is noon
  const hours24 = (hours % 12) + (period === 'PM' ? 12 : 0);
  return { time: `${pad(hours24)}:${pad(minutes)}`, period };
}

// Today, tomorrow, or seven days from today ("next week")
function quickDate(key) {
  const d = new Date();
  if (key === 'tomorrow') d.setDate(d.getDate() + 1);
  if (key === 'next-week') d.setDate(d.getDate() + 7);
  return toDateValue(d);
}

// New tasks start at the next full hour (after 11 PM that is tomorrow)
function defaultDeadline() {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return toDatetimeValue(d);
}

function setDeadline(datetime) {
  const valid = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(datetime || '');
  inputDate.value = valid ? toDateText(datetime.slice(0, 10)) : '';
  inputTime.value = valid ? toTimeFieldText(datetime.slice(11, 16)) : '';
  if (valid) timePeriod = Number(datetime.slice(11, 13)) < 12 ? 'AM' : 'PM';
  updateDeadlineSummary();
}

// Shows the chosen deadline in the list's format, warns about past
// times, and marks the matching AM/PM and quick pick buttons
function updateDeadlineSummary() {
  const dateResult = parseDateText(inputDate.value);
  const timeResult = parseTime(inputTime.value);
  const date = dateResult && dateResult.date;
  const time = timeResult && timeResult.time;
  const period = timeResult ? timeResult.period : timePeriod;

  ampmButtons.forEach(btn => btn.setAttribute('aria-pressed', String(btn.dataset.period === period)));
  moveIndicator(ampmButtons[0].parentElement);
  document.querySelectorAll('[data-quick-date]').forEach(chip => {
    chip.setAttribute('aria-pressed', String(quickDate(chip.dataset.quickDate) === date));
  });
  document.querySelectorAll('[data-quick-time]').forEach(chip => {
    chip.setAttribute('aria-pressed', String(chip.dataset.quickTime === time));
  });

  if (!date || !time) {
    deadlineSummary.textContent = t(!date && !time ? 'deadline.pickBoth'
      : !date ? 'deadline.pickDate' : 'deadline.pickTime');
    deadlineWarning.hidden = true;
    return;
  }

  const task = { datetime: `${date}T${time}`, completed: editingCompleted };
  const due = new Date(task.datetime);
  let text = t('deadline.preview', {
    weekday: dateNames().daysShort[due.getDay()],
    date: formatDate(task.datetime),
    relative: formatRelative(task),
  });
  // A time skipped by a clock change (e.g. 2:30 AM) moves to the real one
  const realTime = `${pad(due.getHours())}:${pad(due.getMinutes())}`;
  if (realTime !== time) {
    text += t('deadline.clockChange', { typed: toTimeText(time), real: toTimeText(realTime) });
  }
  deadlineSummary.textContent = text;
  deadlineWarning.hidden = !isOverdue(task);
}

// errorText is a function that returns the message in the current
// language, so a visible error follows a language switch
function showFieldError(field, errorText = null, moveFocus = true) {
  field.classList.add('invalid');
  field.setAttribute('aria-invalid', 'true');
  // A deadline error takes the place of the preview line
  if (errorText) {
    deadlineErrorText = errorText;
    deadlineError.textContent = errorText();
    deadlineError.hidden = false;
    deadlineSummary.hidden = true;
  }
  if (moveFocus) field.focus();
}

function clearFieldError(field) {
  field.classList.remove('invalid');
  field.removeAttribute('aria-invalid');
}

function clearDeadlineErrors() {
  clearFieldError(inputDate);
  clearFieldError(inputTime);
  deadlineErrorText = null;
  deadlineError.hidden = true;
  deadlineSummary.hidden = false;
}

document.querySelectorAll('[data-quick-date]').forEach(chip => {
  chip.addEventListener('click', () => {
    inputDate.value = toDateText(quickDate(chip.dataset.quickDate));
    clearDeadlineErrors();
    updateDeadlineSummary();
  });
});

// A quick time with no date yet means today
document.querySelectorAll('[data-quick-time]').forEach(chip => {
  chip.addEventListener('click', () => {
    inputTime.value = toTimeFieldText(chip.dataset.quickTime);
    timePeriod = Number(chip.dataset.quickTime.slice(0, 2)) < 12 ? 'AM' : 'PM';
    if (!parseDateText(inputDate.value)?.date) inputDate.value = toDateText(quickDate('today'));
    clearDeadlineErrors();
    updateDeadlineSummary();
  });
});

// AM/PM buttons switch the typed time between morning and afternoon
ampmButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    timePeriod = btn.dataset.period;
    const result = parseTime(inputTime.value);
    if (result) {
      const hours = Number(result.time.slice(0, 2)) % 12 + (timePeriod === 'PM' ? 12 : 0);
      inputTime.value = toTimeFieldText(`${pad(hours)}:${result.time.slice(3)}`);
    }
    clearDeadlineErrors();
    updateDeadlineSummary();
  });
});

// Arabic-Indic digits typed into the date or time field become 0-9 as
// they are typed (formatDigits shapes them again when tidied)
function normalizeFieldDigits(field) {
  const normal = normalizeDigits(field.value);
  if (normal !== field.value) field.value = normal;
}

// Adds the slashes while typing a date at the end of the field
inputDate.addEventListener('input', (e) => {
  normalizeFieldDigits(inputDate);
  const v = inputDate.value;
  if (e.inputType === 'insertText' && inputDate.selectionStart === v.length) {
    if (/^\d{2}$/.test(v) || /^\d{1,2}\/\d{2}$/.test(v)) inputDate.value = v + '/';
    else if (v.endsWith('//')) inputDate.value = v.slice(0, -1);
  }
});

inputTime.addEventListener('input', () => normalizeFieldDigits(inputTime));

[inputDate, inputTime].forEach(field => {
  field.addEventListener('input', () => {
    clearDeadlineErrors();
    updateDeadlineSummary();
  });
});

// Tidy a typed date such as "1/2/2026" into "01/02/2026" when leaving the
// field, and point out an impossible one unless the calendar or a quick
// date button is about to set it
inputDate.addEventListener('blur', (e) => {
  const result = parseDateText(inputDate.value);
  if (result && result.date) {
    inputDate.value = toDateText(result.date);
  } else if (result && result.error) {
    const next = e.relatedTarget;
    const picking = next && (inputDateWrap.contains(next) || next.matches('[data-quick-date]'));
    if (!picking) showFieldError(inputDate, result.error, false);
  }
});

// Tidy a typed time such as "230pm" into "2:30 PM" when leaving the field
inputTime.addEventListener('blur', () => {
  const result = parseTime(inputTime.value);
  if (result) {
    inputTime.value = toTimeFieldText(result.time);
    timePeriod = result.period;
    updateDeadlineSummary();
  }
});

// ── Calendar ──
// A small month view. The week starts on Monday in English and Sunday in
// Arabic. Arrow keys move by day or week (mirrored in right-to-left),
// Page Up/Down by month, Home/End to the week's ends.

// Position of a weekday (0 = Sunday) within the displayed week
function weekPosition(weekday) {
  return (weekday - dateNames().weekStart + 7) % 7;
}

function renderCalendar() {
  const [year, month] = calFocus.split('-').map(Number);
  const offset = weekPosition(new Date(year, month - 1, 1).getDay());
  const days = new Date(year, month, 0).getDate();
  const selected = parseDateText(inputDate.value)?.date;
  const today = quickDate('today');
  const names = dateNames();

  calTitle.textContent = t('date.monthYear', { month: names.months[month - 1], year });
  calHead.innerHTML = [0, 1, 2, 3, 4, 5, 6].map(i => {
    const weekday = (i + names.weekStart) % 7;
    return `<th scope="col" abbr="${names.days[weekday]}">${names.daysNarrow[weekday]}</th>`;
  }).join('');
  let html = '';
  for (let day = 1 - offset; day <= days; day += 7) {
    html += '<tr>';
    for (let i = day; i < day + 7; i++) {
      if (i < 1 || i > days) {
        html += '<td></td>';
        continue;
      }
      const value = `${year}-${pad(month)}-${pad(i)}`;
      html += `<td><button type="button" class="cal-day" data-date="${value}"`
        + ` tabindex="${value === calFocus ? 0 : -1}" aria-pressed="${value === selected}"`
        + `${value === today ? ' aria-current="date"' : ''}`
        + ` aria-label="${formatLongDate(new Date(year, month - 1, i))}">${formatDigits(i)}</button></td>`;
    }
    html += '</tr>';
  }
  calBody.innerHTML = html;
}

function focusCalendarDay() {
  const btn = calBody.querySelector(`[data-date="${calFocus}"]`);
  if (btn) btn.focus();
}

function openCalendar() {
  calFocus = parseDateText(inputDate.value)?.date || quickDate('today');
  renderCalendar();
  calendar.hidden = false;
  btnCalendar.setAttribute('aria-expanded', 'true');
  focusCalendarDay();
}

function closeCalendar(returnFocus = true) {
  if (calendar.hidden) return;
  calendar.hidden = true;
  btnCalendar.setAttribute('aria-expanded', 'false');
  if (returnFocus) btnCalendar.focus();
}

// Moves the calendar by days or by months (keeping the day if it exists)
function shiftCalendar(days, months = 0) {
  const [year, month, day] = calFocus.split('-').map(Number);
  const target = new Date(year, month - 1 + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay) + days);
  calFocus = toDateValue(target);
  renderCalendar();
}

btnCalendar.addEventListener('click', () => {
  if (calendar.hidden) openCalendar();
  else closeCalendar();
});

document.getElementById('cal-prev').addEventListener('click', () => shiftCalendar(0, -1));
document.getElementById('cal-next').addEventListener('click', () => shiftCalendar(0, 1));

calBody.addEventListener('click', (e) => {
  const btn = e.target.closest('.cal-day');
  if (!btn) return;
  inputDate.value = toDateText(btn.dataset.date);
  clearDeadlineErrors();
  updateDeadlineSummary();
  closeCalendar();
});

calBody.addEventListener('keydown', (e) => {
  const step = document.documentElement.dir === 'rtl' ? -1 : 1;
  const moves = { ArrowLeft: -step, ArrowRight: step, ArrowUp: -7, ArrowDown: 7 };
  const weekday = weekPosition(new Date(`${calFocus}T00:00`).getDay());
  if (e.key in moves) shiftCalendar(moves[e.key]);
  else if (e.key === 'PageUp') shiftCalendar(0, -1);
  else if (e.key === 'PageDown') shiftCalendar(0, 1);
  else if (e.key === 'Home') shiftCalendar(-weekday);
  else if (e.key === 'End') shiftCalendar(6 - weekday);
  else return;
  e.preventDefault();
  focusCalendarDay();
});

// Clicking or tabbing anywhere else closes the calendar
document.addEventListener('pointerdown', (e) => {
  if (!calendar.hidden && !calendar.contains(e.target) && !btnCalendar.contains(e.target)) {
    closeCalendar(false);
  }
});

document.addEventListener('focusin', (e) => {
  if (!calendar.hidden && !calendar.contains(e.target) && e.target !== btnCalendar) {
    closeCalendar(false);
  }
});

inputName.addEventListener('input', () => clearFieldError(inputName));

// Tooltips with the real dates behind the quick date buttons
function updateQuickDateTitles() {
  document.querySelectorAll('[data-quick-date]').forEach(chip => {
    chip.title = formatLongDate(new Date(`${quickDate(chip.dataset.quickDate)}T00:00`));
  });
}

function openModal(task = null) {
  modalOpener = document.activeElement;
  editingId = task ? task.id : null;
  editingCompleted = task ? task.completed : false;
  modalTitle.textContent = t(task ? 'modal.edit' : 'modal.add');

  // Cancel and reopen always starts clean
  clearFieldError(inputName);
  clearDeadlineErrors();

  inputName.value      = task ? task.name : '';
  inputPriority.value  = task ? task.priority : 'low';
  setDeadline(task ? task.datetime : defaultDeadline());

  updateQuickDateTitles();
  closeCalendar(false);

  const knownLabels = ['university', 'work', 'personal', 'health'];
  if (task && !knownLabels.includes(task.label)) {
    inputLabel.value = 'other';
    inputCustomLabel.value = task.label;
    customLabelGroup.style.display = 'flex';
  } else {
    inputLabel.value = task ? task.label : 'university';
    inputCustomLabel.value = '';
    customLabelGroup.style.display = 'none';
  }

  modalOverlay.classList.remove('leaving');
  modalOverlay.classList.add('active');
  inputName.focus();
}

function closeModal() {
  closeCalendar(false);
  modalOverlay.classList.remove('active');
  playLeave(modalOverlay);
  editingId = null;
  restoreFocus(modalOpener, btnAdd);
}

// The dialog and side menu fade out with a 'leaving' class, which lets
// clicks through and goes when the animation ends (on animation time, not
// a timer). Reduced motion closes them at once.
function playLeave(overlay) {
  if (!reducedMotion.matches) overlay.classList.add('leaving');
}

function endLeave(e) {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove('leaving');
}

inputLabel.addEventListener('change', () => {
  customLabelGroup.style.display =
    inputLabel.value === 'other' ? 'flex' : 'none';
});

// ─── TOAST ───────────────────────────────────────────

const toastEl      = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const toastAction  = document.getElementById('toast-action');

let toastTimer = null;
let toastCallback = null;
let toastText = null;
let toastActionKey = null;

// Short message at the bottom of the screen, with an optional action
// button (used for Undo). Hides itself after 6 seconds. getText returns
// the message in the current language, so it follows a language switch.
function showToast(getText, actionKey = null, onAction = null) {
  toastText = getText;
  toastActionKey = actionKey;
  renderToast();
  toastAction.hidden = !actionKey;
  toastCallback = onAction;
  toastEl.classList.add('active');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 6000);
}

function renderToast() {
  if (!toastText) return;
  toastMessage.textContent = toastText();
  toastAction.textContent = toastActionKey ? t(toastActionKey) : '';
}

function hideToast() {
  toastEl.classList.remove('active');
  toastCallback = null;
}

toastAction.addEventListener('click', () => {
  const callback = toastCallback;
  clearTimeout(toastTimer);
  hideToast();
  if (callback) callback();
});

// ─── EVENTS ──────────────────────────────────────────

btnAdd.addEventListener('click', () => openModal());

document.getElementById('btn-close-modal').addEventListener('click', closeModal);
document.getElementById('btn-cancel').addEventListener('click', closeModal);

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});
modalOverlay.addEventListener('animationend', endLeave);

document.getElementById('btn-save').addEventListener('click', () => {
  const name = inputName.value.trim();
  const dateResult = parseDateText(inputDate.value);
  const timeResult = parseTime(inputTime.value);

  if (!name) {
    showFieldError(inputName);
    return;
  }
  clearFieldError(inputName);

  if (!dateResult || dateResult.error) {
    showFieldError(inputDate, dateResult ? dateResult.error : () => t('deadline.pickDate'));
    return;
  }

  if (!timeResult) {
    showFieldError(inputTime, inputTime.value.trim()
      ? () => t('error.timeFormat', { example: formatClock(14, 30) })
      : () => t('error.time'));
    return;
  }
  clearDeadlineErrors();
  inputDate.value = toDateText(dateResult.date);
  inputTime.value = toTimeFieldText(timeResult.time);
  timePeriod = timeResult.period;

  // Same "YYYY-MM-DDTHH:mm" format as before. Going through Date turns a
  // time skipped by a clock change into the real one.
  const datetime = toDatetimeValue(new Date(`${dateResult.date}T${timeResult.time}`));

  const label = inputLabel.value === 'other'
    ? (inputCustomLabel.value.trim() || 'other')
    : inputLabel.value;

  const taskData = {
    id:        editingId || generateId(),
    name,
    datetime,
    label,
    priority:  inputPriority.value,
    completed: false,
  };

  if (editingId) {
    const existing = tasks.find(t => t.id === editingId);
    taskData.completed = existing ? existing.completed : false;
    // New deadline means a new reminder
    if (existing && existing.datetime !== datetime) clearNotified(editingId);
    tasks = tasks.map(t => t.id === editingId ? taskData : t);
  } else {
    tasks.push(taskData);
  }

  saveTasks();
  applyFilterAndSearch();
  closeModal();
});

// Clicking anywhere on a task row (except the checkbox) selects it for
// edit/delete. Selected rows get a highlighted border via the
// 'selected' class in CSS.
taskListEl.addEventListener('click', (e) => {
  if (e.target.classList.contains('task-checkbox')) return;
  const row = e.target.closest('.task-row');
  if (!row) return;
  const id = row.dataset.id;

  if (selectedIds.has(id)) {
    selectedIds.delete(id);
  } else {
    selectedIds.add(id);
  }
  // Only the row's look changes, so the list is not redrawn
  row.classList.toggle('selected', selectedIds.has(id));
  updateActionButtons();
});

// The checkbox only toggles "completed"; clicking the row selects it.
taskListEl.addEventListener('change', (e) => {
  if (!e.target.classList.contains('task-checkbox')) return;
  const id = e.target.closest('.task-row').dataset.id;
  const isChecked = e.target.checked;
  poppedId = isChecked ? id : null;
  tasks = tasks.map(t => t.id === id ? { ...t, completed: isChecked } : t);
  saveTasks();
  applyFilterAndSearch();
});

const btnEdit   = document.getElementById('btn-edit');
const btnDelete = document.getElementById('btn-delete');

// Edit needs exactly one selected task, Delete at least one. The
// tooltip says why a button is disabled.
function updateActionButtons() {
  const count = selectedIds.size;

  btnEdit.disabled = count !== 1;
  btnEdit.title = t(count === 1 ? 'header.edit'
    : count === 0 ? 'header.edit.none'
    : 'header.edit.many');

  btnDelete.disabled = count === 0;
  btnDelete.title = count === 0 ? t('header.delete.none') : t('header.delete', { count });

  btnEdit.setAttribute('aria-label', btnEdit.title);
  btnDelete.setAttribute('aria-label', btnDelete.title);
}

btnEdit.addEventListener('click', () => {
  if (selectedIds.size !== 1) return;
  const id = [...selectedIds][0];
  const task = tasks.find(t => t.id === id);
  if (task) openModal(task);
});

btnDelete.addEventListener('click', () => {
  if (selectedIds.size === 0) return;
  // Keep each task's index so undo can put it back in place
  const removed = tasks
    .map((task, index) => ({ task, index }))
    .filter(({ task }) => selectedIds.has(task.id));
  const before = listPositions();
  fadeOutRows(selectedIds);
  tasks = tasks.filter(t => !selectedIds.has(t.id));
  selectedIds.clear();
  saveTasks();
  applyFilterAndSearch();
  slideIntoPlace(before);
  // Forgotten, so Undo brings them back with the entrance animation
  removed.forEach(({ task }) => seenIds.delete(task.id));

  const count = removed.length;
  showToast(() => t('toast.deleted', { count }), 'toast.undo', () => {
    removed.forEach(({ task, index }) => tasks.splice(index, 0, task));
    saveTasks();
    updateOverdueTasks();
    applyFilterAndSearch();
  });
});

// Deleted rows fade and shrink while the rest slide up into place. The
// fading copies sit in a closed shadow root, so they never count as rows.
const mainEl = document.querySelector('.main');
let ghostRoot = null;

function ghostLayer() {
  if (!ghostRoot) {
    const host = document.createElement('div');
    host.className = 'ghost-layer';
    host.setAttribute('aria-hidden', 'true');
    ghostRoot = host.attachShadow({ mode: 'closed' });
    // The page's own rules, copied once, so the copies look the same
    const sheet = new CSSStyleSheet();
    const pageSheet = [...document.styleSheets].find(s => s.href && s.href.endsWith('style.css'));
    sheet.replaceSync([...pageSheet.cssRules].map(rule => rule.cssText).join('\n'));
    ghostRoot.adoptedStyleSheets = [sheet];
    mainEl.appendChild(host);
  }
  return ghostRoot;
}

function fadeOutRows(ids) {
  if (reducedMotion.matches) return;
  const base = mainEl.getBoundingClientRect();
  taskListEl.querySelectorAll('.task-row').forEach(row => {
    if (!ids.has(row.dataset.id)) return;
    const box = row.getBoundingClientRect();
    const ghost = row.cloneNode(true);
    ghost.classList.remove('enter');
    Object.assign(ghost.style, {
      position: 'absolute', margin: '0',
      top: `${box.top - base.top}px`, left: `${box.left - base.left}px`,
      width: `${box.width}px`, height: `${box.height}px`,
    });
    ghostLayer().appendChild(ghost);
    const fade = ghost.animate(
      [{ opacity: 1 }, { opacity: 0, transform: 'scale(0.94)' }],
      { duration: 260, easing: 'ease-in', id: 'row-out' },
    );
    fade.onfinish = () => ghost.remove();
  });
}

// Where each row and group header is, so they can slide from there
function listPositions() {
  const tops = new Map();
  taskListEl.querySelectorAll('[data-id], [data-group]').forEach(el => {
    tops.set(el.dataset.id ?? `group:${el.dataset.group}`, el.getBoundingClientRect().top);
  });
  return tops;
}

function slideIntoPlace(before) {
  if (reducedMotion.matches) return;
  taskListEl.querySelectorAll('[data-id], [data-group]').forEach(el => {
    const top = before.get(el.dataset.id ?? `group:${el.dataset.group}`);
    if (top === undefined) return;
    const shift = top - el.getBoundingClientRect().top;
    if (Math.abs(shift) < 1) return;
    el.animate(
      [{ transform: `translateY(${shift}px)` }, { transform: 'none' }],
      { duration: 300, easing: 'ease-out' },
    );
  });
}

document.getElementById('btn-reload').addEventListener('click', () => {
  loadTasks();
  window.smartTasksChanged?.();
  updateOverdueTasks();
  applyFilterAndSearch();
});

// ─── SEARCH ──────────────────────────────────────────

const searchBar   = document.getElementById('search-bar');
const searchInput = document.getElementById('search-input');
const btnSearch   = document.getElementById('btn-search');
const btnClearSearch = document.getElementById('btn-clear-search');
let currentFilter = 'all';

// Search ignores case, extra spaces, Arabic short vowels (tashkeel),
// tatweel and invisible direction marks, treats أ إ آ ٱ as ا, ة as ه and
// ى as ي, and reads Arabic-Indic digits as 0-9. Task names and the search
// text go through the same steps.
const ARABIC_MARKS = /[ؐ-ًؚ-ٰٟۖ-ۜ۟-۪ۨ-ۭـ​-‏؜]/g;

function normalizeSearchText(text) {
  return normalizeDigits(text.normalize('NFKC'))
    .toLowerCase()
    .replace(ARABIC_MARKS, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}

// The clear button only shows while there is text to clear
function updateClearButton() {
  btnClearSearch.hidden = !searchInput.value;
}

function closeSearch() {
  searchBar.classList.remove('active');
  searchInput.value = '';
  updateClearButton();
  applyFilterAndSearch();
  btnSearch.focus();
}

btnSearch.addEventListener('click', () => {
  if (searchBar.classList.contains('active')) {
    closeSearch();
  } else {
    searchBar.classList.add('active');
    searchInput.focus();
    loadSmart();
    window.smartSearchOpened?.();
  }
});

document.getElementById('btn-close-search').addEventListener('click', closeSearch);

searchInput.addEventListener('input', () => {
  updateClearButton();
  applyFilterAndSearch();
});

btnClearSearch.addEventListener('click', () => {
  searchInput.value = '';
  updateClearButton();
  applyFilterAndSearch();
  searchInput.focus();
});

// ─── FILTER ──────────────────────────────────────────

const filterBar = document.getElementById('filter-bar');

document.getElementById('btn-filter').addEventListener('click', () => {
  filterBar.classList.toggle('active');
});

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    moveIndicator(btn.parentElement);
    currentFilter = btn.dataset.filter;
    applyFilterAndSearch();
  });
});

const filterLabel    = document.getElementById('filter-label');
const filterPriority = document.getElementById('filter-priority');

filterLabel.addEventListener('change', applyFilterAndSearch);
filterPriority.addEventListener('change', applyFilterAndSearch);

// Same capitalisation the label pills get from CSS. Built-in labels show
// their translated name.
function formatLabel(label) {
  return BUILT_IN_LABELS.includes(label)
    ? labelName(label)
    : label.replace(/(^|\s)\S/g, c => c.toUpperCase());
}

// Label options come from the labels in use, custom ones included. The
// selected label stays in the list even if no task uses it any more.
function updateLabelOptions() {
  const selected = filterLabel.value;
  const labels = [...new Set(tasks.map(t => t.label).filter(Boolean))];
  if (selected !== 'all' && !labels.includes(selected)) labels.push(selected);
  labels.sort((a, b) => formatLabel(a).localeCompare(formatLabel(b), currentLang));

  filterLabel.innerHTML = `<option value="all">${escapeHTML(t('filter.allLabels'))}</option>`
    + labels.map(l => `<option value="${escapeHTML(l)}" dir="auto">${escapeHTML(formatLabel(l))}</option>`).join('');
  filterLabel.value = selected;
}

function applyFilterAndSearch() {
  const query = normalizeSearchText(searchInput.value);

  updateLabelOptions();
  const label = filterLabel.value;
  const priority = filterPriority.value;
  filterLabel.classList.toggle('active', label !== 'all');
  filterPriority.classList.toggle('active', priority !== 'all');

  let filtered = tasks;

  if (currentFilter === 'active') {
    filtered = filtered.filter(t => !t.completed && !isOverdue(t));
  } else if (currentFilter === 'overdue') {
    filtered = filtered.filter(isOverdue);
  } else if (currentFilter === 'completed') {
    filtered = filtered.filter(t => t.completed);
  }

  if (label !== 'all') {
    filtered = filtered.filter(t => t.label === label);
  }

  if (priority !== 'all') {
    filtered = filtered.filter(t => t.priority === priority);
  }

  // Word matches first; smart search (if on) adds tasks that match by
  // meaning. Those are picked from all tasks, so a filter only hides them
  // and never lets a weaker one in.
  let related = [];
  if (query) {
    const matchIds = new Set(tasks.filter(t => normalizeSearchText(t.name).includes(query)).map(t => t.id));
    const shownIds = new Set(filtered.map(t => t.id));
    related = (window.smartMatches?.(searchInput.value, tasks.filter(t => !matchIds.has(t.id))) || [])
      .filter(t => shownIds.has(t.id));
    filtered = filtered.filter(t => matchIds.has(t.id));
  } else {
    window.smartMatches?.('', []);
  }

  // Tasks hidden by a filter or search (or deleted) leave the
  // selection, so Delete never removes a hidden task
  const visibleIds = new Set([...filtered, ...related].map(t => t.id));
  selectedIds = new Set([...selectedIds].filter(id => visibleIds.has(id)));

  renderTasks(filtered, related);
  renderStats();
  updateActionButtons();
}

// ─── SORT ────────────────────────────────────────────

// Sorts inside each group. The choice is remembered.
const sortButtons = document.querySelectorAll('[data-sort]');

function showSort() {
  sortButtons.forEach(btn => btn.setAttribute('aria-pressed', String(btn.dataset.sort === currentSort)));
}

sortButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    currentSort = btn.dataset.sort;
    localStorage.setItem('sort', currentSort);
    showSort();
    moveIndicator(btn.parentElement);
    applyFilterAndSearch();
  });
});

showSort();

// ─── STATS ───────────────────────────────────────────

const statsText    = document.getElementById('stats-text');
const statsPercent = document.getElementById('stats-percent');
const progressEl   = document.getElementById('progress');
const progressBar  = document.getElementById('progress-bar');
let lastStats = null;

// Progress for tasks due today, counted over all tasks (not the filtered list)
function renderStats() {
  const dueToday = tasks.filter(isDueToday);
  const done = dueToday.filter(t => t.completed).length;
  const percent = dueToday.length ? Math.round(done / dueToday.length * 100) : 0;

  statsText.textContent = dueToday.length
    ? t('stats.done', { done, total: dueToday.length })
    : t('stats.none');
  // The line rolls in when the numbers change (not on a language switch),
  // and CSS counts the percentage to its new value
  const numbers = `${done}/${dueToday.length}`;
  if (lastStats !== null && numbers !== lastStats) {
    statsText.classList.remove('roll');
    void statsText.offsetWidth;
    statsText.classList.add('roll');
  }
  lastStats = numbers;
  statsPercent.style.setProperty('--pct', percent);
  statsPercent.classList.toggle('empty', !dueToday.length);
  progressBar.style.width = `${percent}%`;
  progressEl.setAttribute('aria-valuenow', percent);
}

// ─── OVERDUE AUTO-LOCK ───────────────────────────────

// A task whose deadline has passed gets its checkbox disabled in
// renderTasks() (see isLocked()). Overdue is never saved; this only
// tracks which group each task is in so the list re-renders when one
// crosses its deadline or moves into Today at midnight.
let lastGroups = '';

function updateOverdueTasks() {
  const current = tasks.map(t => `${t.id}:${getGroup(t)}`).join(',');
  const changed = current !== lastGroups;
  lastGroups = current;
  return changed;
}

// ─── ASIDE ───────────────────────────────────────────

const asideOverlay  = document.getElementById('aside-overlay');
const btnMenu       = document.getElementById('btn-menu');
const btnCloseAside = document.getElementById('btn-close-aside');

// Focus moves into the menu when it opens and back to its button on close
function openAside() {
  loadSmart();
  asideOverlay.classList.remove('leaving');
  asideOverlay.classList.add('active');
  btnCloseAside.focus();
}

function closeAside() {
  asideOverlay.classList.remove('active');
  playLeave(asideOverlay);
  btnMenu.focus();
}

btnMenu.addEventListener('click', openAside);
btnCloseAside.addEventListener('click', closeAside);

asideOverlay.addEventListener('click', (e) => {
  if (e.target === asideOverlay) closeAside();
});
asideOverlay.addEventListener('animationend', endLeave);

// Theme
// The colours live in style.css; a theme only sets data-theme on <html>.
// The theme-color tags keep their own colour for each OS setting under
// System, and both show the chosen theme's colour otherwise.
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
const themeMetas = [...document.querySelectorAll('meta[name="theme-color"]')];
themeMetas.forEach(meta => { meta.dataset.color = meta.content; });

const prefTheme = document.getElementById('pref-theme');
prefTheme.value = localStorage.getItem('theme') || 'system';
applyTheme(prefTheme.value);

prefTheme.addEventListener('change', () => {
  localStorage.setItem('theme', prefTheme.value);
  applyTheme(prefTheme.value);
});

// Follow OS changes while "System default" is selected
systemDark.addEventListener('change', () => {
  if (prefTheme.value === 'system') applyTheme('system');
});

function applyTheme(theme) {
  const shown = theme === 'light' || theme === 'dark' ? theme
    : systemDark.matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = shown;
  // Browser and installed app title bar match the header
  const chosen = themeMetas.find(meta => meta.media.includes(shown)).dataset.color;
  themeMetas.forEach(meta => {
    meta.content = theme === 'system' ? meta.dataset.color : chosen;
  });
}

// Notifications
const prefNotif = document.getElementById('pref-notifications');
prefNotif.checked = localStorage.getItem('notifications') === 'true';

prefNotif.addEventListener('change', async () => {
  if (prefNotif.checked) {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      prefNotif.checked = false;
      return;
    }
  }
  localStorage.setItem('notifications', prefNotif.checked);
});

// Remind 15 minutes before a deadline, once per task. Notified ids are
// kept in localStorage so a reload does not notify again.
const NOTIFY_BEFORE_MS = 15 * 60 * 1000;
let notifiedIds = new Set(JSON.parse(localStorage.getItem('notifiedIds') || '[]'));

function saveNotifiedIds() {
  localStorage.setItem('notifiedIds', JSON.stringify([...notifiedIds]));
}

function clearNotified(id) {
  if (notifiedIds.delete(id)) saveNotifiedIds();
}

function checkNotifications() {
  if (localStorage.getItem('notifications') !== 'true') return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const now = Date.now();
  let changed = false;
  tasks.forEach(task => {
    if (task.completed || task.sample || notifiedIds.has(task.id)) return;
    const due = new Date(task.datetime).getTime();
    if (due > now && due - now <= NOTIFY_BEFORE_MS) {
      new Notification(t('notify.title'), {
        body: t('notify.body', { name: task.name, date: formatDate(task.datetime) }),
        lang: currentLang,
        dir: currentLang === 'ar' ? 'rtl' : 'ltr',
      });
      notifiedIds.add(task.id);
      changed = true;
    }
  });
  if (changed) saveNotifiedIds();
}

document.getElementById('btn-notif-settings').addEventListener('click', () => {
  showToast(() => t('toast.notificationHelp'));
});

// Export report, in the app's current language
document.getElementById('btn-export').addEventListener('click', () => {
  const completed = tasks.filter(task => task.completed).length;
  const overdue = tasks.filter(isOverdue).length;
  const active = tasks.length - completed - overdue;
  const priorityName = p => PRIORITY_RANK[p] === undefined ? p : t(`priority.${p}`);

  const lines = [
    t('report.title'),
    t('report.generated', { date: formatDate(new Date()) }),
    t('report.counts', { total: tasks.length, active, overdue, completed }),
    '─────────────────────────────────────────',
    '',
  ];
  tasks.forEach((task, i) => {
    lines.push(
      `[${formatDigits(i + 1)}] ${task.name}`,
      t('report.date', { value: formatDate(task.datetime) || t('report.noDate') }),
      t('report.label', { value: labelName(task.label) }),
      t('report.priority', { value: priorityName(task.priority) }),
      t('report.status', { value: getStatus(task) }),
      '',
    );
  });

  // A right-to-left mark at the start of each Arabic line makes Notepad and
  // other plain text viewers lay it out right to left
  const rtl = currentLang === 'ar' ? '‏' : '';
  const report = lines.map(line => line ? rtl + line : line).join('\n') + '\n';
  // UTF-8 with a byte order mark so Arabic opens correctly in Notepad and Excel
  downloadFile(t('report.file'), '﻿' + report, 'text/plain;charset=utf-8');
});

// Backup
document.getElementById('btn-backup').addEventListener('click', () => {
  const data = JSON.stringify(tasks, null, 2);
  downloadFile('tasks-backup.json', data, 'application/json');
});

// Restore
document.getElementById('btn-restore').addEventListener('click', () => {
  document.getElementById('restore-file-input').click();
});

document.getElementById('restore-file-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const restored = JSON.parse(event.target.result);
      if (!Array.isArray(restored)) throw new Error();
      // Ids are kept as strings; a missing or duplicate id gets a new one
      const seenIds = new Set();
      tasks = restored.map(t => {
        let id = t.id == null || t.id === '' ? '' : String(t.id);
        if (!id || seenIds.has(id)) id = generateId();
        seenIds.add(id);
        return { ...t, id, completed: t.completed ?? false };
      });
      selectedIds.clear();
      saveTasks();
      updateOverdueTasks();
      applyFilterAndSearch();
      closeAside();
      const count = tasks.length;
      showToast(() => t('toast.restored', { count }));
    } catch {
      showToast(() => t('toast.invalidBackup'));
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── LANGUAGE ────────────────────────────────────────

const btnLang  = document.getElementById('btn-lang');
const prefLang = document.getElementById('pref-lang');

// Each language is listed in its own script
prefLang.querySelectorAll('option').forEach(option => {
  option.textContent = LANGUAGE_NAMES[option.value];
});

// Puts the whole UI into the current language without a reload. The
// selection, filters, search text and anything typed in the modal stay.
function applyLanguage() {
  const root = document.documentElement;
  const other = currentLang === 'ar' ? 'en' : 'ar';
  root.lang = currentLang;
  root.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  document.title = t('app.title');
  translatePage();

  // The header button names the language you would switch to
  btnLang.textContent = LANGUAGE_NAMES[other];
  btnLang.lang = other;
  prefLang.value = currentLang;

  // Modal: times shown as "3:00 PM" or "3:00 م", the preview and any error.
  // The date placeholder is "DD/MM/YYYY" in English, an example date in Arabic.
  inputDate.placeholder = t('field.datePlaceholder', { example: formatDigits('17/10/2026') });
  document.querySelectorAll('[data-quick-time]').forEach(chip => {
    chip.textContent = toTimeText(chip.dataset.quickTime);
  });
  if (document.activeElement !== inputTime) {
    const time = parseTime(inputTime.value);
    if (time) {
      inputTime.value = toTimeFieldText(time.time);
      timePeriod = time.period;
    }
  }
  if (document.activeElement !== inputDate) {
    const date = parseDateText(inputDate.value);
    if (date && date.date) inputDate.value = toDateText(date.date);
  }
  modalTitle.textContent = t(editingId ? 'modal.edit' : 'modal.add');
  updateQuickDateTitles();
  updateDeadlineSummary();
  if (deadlineErrorText) deadlineError.textContent = deadlineErrorText();

  // An open calendar is redrawn with the new week start and names
  if (!calendar.hidden) {
    const dayFocused = document.activeElement.classList.contains('cal-day');
    renderCalendar();
    if (dayFocused) focusCalendarDay();
  }

  renderToast();
  window.renderSmart?.();
  window.renderGuide?.();
  applyFilterAndSearch();
  // Item widths and the start side change with the language
  updateIndicators();
}

function setLanguage(lang, save = true) {
  if (!STRINGS[lang]) return;
  currentLang = lang;
  if (save) localStorage.setItem('lang', lang);
  applyLanguage();
}

btnLang.addEventListener('click', () => setLanguage(currentLang === 'ar' ? 'en' : 'ar'));
prefLang.addEventListener('change', () => setLanguage(prefLang.value));

// A switch made in another open tab of the app
window.addEventListener('storage', (e) => {
  if (e.key === 'lang' && e.newValue && e.newValue !== currentLang) setLanguage(e.newValue, false);
});

// ─── GUIDE ───────────────────────────────────────────

// A first visit gets the welcome card, people who already have tasks a
// one-time offer in a toast. The tour and the Help panel are in tour.js
// and tour.css, added the first time either is opened. localStorage 'tour'
// remembers that the tour was offered, skipped or done.
const welcomeOverlay = document.getElementById('welcome-overlay');
const welcomeTitle   = document.getElementById('welcome-title');
const welcomeSamples = document.getElementById('welcome-samples');
let welcomeOpener = null;
let welcomeFirst = false;
const guideFiles = {};

// Each file is added once; one that failed to load is tried again next time
function loadGuideFile(tag, url) {
  guideFiles[url] = guideFiles[url] || new Promise((resolve, reject) => {
    const el = document.createElement(tag);
    if (tag === 'link') {
      el.rel = 'stylesheet';
      el.href = url;
    } else {
      el.src = url;
    }
    el.onload = resolve;
    el.onerror = () => {
      el.remove();
      delete guideFiles[url];
      reject();
    };
    (tag === 'link' ? document.head : document.body).append(el);
  });
  return guideFiles[url];
}

function loadGuide() {
  return Promise.all([loadGuideFile('link', 'tour.css'), loadGuideFile('script', 'tour.js')]);
}

function startTour(options) {
  loadGuide().then(() => runTour(options), () => showToast(() => t('tour.failed')));
}

// The tour needs tasks to point at, so with none it starts from the
// welcome card, which offers sample tasks
function takeTour(opener) {
  if (tasks.length) startTour({ opener });
  else openWelcome(false, opener);
}

function openHelpPanel(opener, topic) {
  loadGuide().then(() => openHelp(opener, topic), () => showToast(() => t('tour.failed')));
}

function openWelcome(first, opener = document.activeElement) {
  welcomeFirst = first;
  welcomeOpener = opener;
  welcomeTitle.dataset.i18n = first ? 'welcome.title' : 'welcome.titleAgain';
  welcomeTitle.textContent = t(welcomeTitle.dataset.i18n);
  welcomeSamples.checked = true;
  welcomeOverlay.classList.remove('leaving');
  welcomeOverlay.classList.add('active');
  document.getElementById('btn-welcome-start').focus();
}

function closeWelcome(returnFocus = true) {
  if (!welcomeOverlay.classList.contains('active')) return;
  welcomeOverlay.classList.remove('active');
  playLeave(welcomeOverlay);
  if (returnFocus) restoreFocus(welcomeOpener, btnAdd);
}

// Skipping on a first visit is remembered and says where the tour lives
function skipWelcome() {
  if (!welcomeOverlay.classList.contains('active')) return;
  closeWelcome();
  if (!welcomeFirst) return;
  localStorage.setItem('tour', 'skipped');
  showToast(() => t('tour.later'));
}

document.getElementById('btn-welcome-start').addEventListener('click', () => {
  closeWelcome(false);
  startTour({ opener: welcomeOpener, samples: welcomeSamples.checked });
});
document.getElementById('btn-welcome-skip').addEventListener('click', skipWelcome);
welcomeOverlay.addEventListener('click', (e) => {
  if (e.target === welcomeOverlay) skipWelcome();
});
welcomeOverlay.addEventListener('animationend', endLeave);
welcomeOverlay.addEventListener('keydown', (e) => trapTab(e, welcomeOverlay));

// Shown once, and not over another message
function offerTour() {
  if (toastEl.classList.contains('active') || localStorage.getItem('tour') !== null) return;
  localStorage.setItem('tour', 'offered');
  showToast(() => t('tour.offer'), 'welcome.start', () => startTour({ opener: null }));
}

document.getElementById('btn-tour').addEventListener('click', (e) => takeTour(e.currentTarget));
document.getElementById('btn-help').addEventListener('click', (e) => openHelpPanel(e.currentTarget));
document.getElementById('btn-install-help').addEventListener('click', (e) => openHelpPanel(e.currentTarget, 'install'));

// Keeps Tab and Shift+Tab inside an open dialog (welcome card, tour, Help)
function trapTab(e, box) {
  if (e.key !== 'Tab') return;
  const items = [...box.querySelectorAll('button, input, select')]
    .filter(el => !el.disabled && el.getClientRects().length);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  const outside = !box.contains(document.activeElement);
  if (outside || document.activeElement === (e.shiftKey ? first : last)) {
    e.preventDefault();
    (e.shiftKey ? last : first).focus();
  }
}

// ─── KEYBOARD ────────────────────────────────────────

// True while focus is in a field, so letter shortcuts don't fire
function isTypingTarget(el) {
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}

// The smart search prompt (semantic.js) also takes Esc and blocks N
const smartOverlay = document.getElementById('smart-overlay');

// Adds semantic.js the first time smart search may be needed. Once loaded
// it catches up with the page by itself.
let smartRequested = false;
function loadSmart() {
  if (smartRequested) return;
  smartRequested = true;
  const script = document.createElement('script');
  script.src = 'semantic.js';
  document.body.append(script);
}

document.addEventListener('keydown', (e) => {
  // Esc closes whatever is on top: calendar, modal, smart search prompt,
  // welcome card, side menu, then search (the tour and Help take their own)
  if (e.key === 'Escape') {
    if (!calendar.hidden) closeCalendar();
    else if (modalOverlay.classList.contains('active')) closeModal();
    else if (smartOverlay.classList.contains('active')) closeSmartDialog();
    else if (welcomeOverlay.classList.contains('active')) skipWelcome();
    else if (asideOverlay.classList.contains('active')) closeAside();
    else if (searchBar.classList.contains('active')) closeSearch();
    return;
  }

  // N opens a new task, but not while typing, with Ctrl/Cmd/Alt held,
  // or while the modal, side menu or a prompt is open. e.code is the
  // physical key, so it also works with an Arabic keyboard layout (where N types ى).
  if (e.code !== 'KeyN') return;
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
  if (isTypingTarget(e.target)) return;
  if ([modalOverlay, asideOverlay, smartOverlay, welcomeOverlay].some(el => el.classList.contains('active'))) return;
  e.preventDefault();
  openModal();
});

// Enter saves from a text field in the modal (name, date, time, custom
// label). Buttons and selects keep their own Enter behaviour, and a held
// key saves once.
modalOverlay.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || e.repeat || e.isComposing) return;
  if (!e.target.matches('input[type="text"]')) return;
  e.preventDefault();
  document.getElementById('btn-save').click();
});

// ─── MOTION ──────────────────────────────────────────

// The moving background rests while the tab is hidden
document.addEventListener('visibilitychange', () => {
  document.documentElement.classList.toggle('paused', document.hidden);
});

// The sticky header gets its shadow once the page scrolls under it
const headerEl = document.querySelector('.header');
window.addEventListener('scroll', () => {
  headerEl.classList.toggle('scrolled', window.scrollY > 4);
}, { passive: true });

// ─── INIT ────────────────────────────────────────────

function init() {
  loadTasks();
  updateOverdueTasks();
  // Translates the page and draws the list
  applyLanguage();
  lucide.createIcons();
  // Re-check deadlines every 30s so a task locks itself the moment it
  // becomes overdue, without needing a manual reload. Relative due
  // times and reminders are updated from the same check.
  setInterval(() => {
    if (updateOverdueTasks()) applyFilterAndSearch();
    else refreshRelativeTimes();
    checkNotifications();
  }, 30000);

  // Offline support. Relative path so it also works under /TaskManager-app/
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .catch(err => console.warn('Service worker not registered', err));
  }

  // Smart search is optional, so its code never holds up the first render:
  // it loads after the page if it was used before, otherwise when the
  // search bar or side menu first opens
  if (localStorage.getItem('smartSearch') !== null) window.addEventListener('load', loadSmart, { once: true });

  // First visit: the welcome card with the first render (tour.js loads only
  // if the tour is taken). Existing tasks: a toast once the page has settled.
  if (localStorage.getItem('tour') === null) {
    if (tasks.length) setTimeout(offerTour, 1500);
    else openWelcome(true);
  }
}

init();