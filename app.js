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
  localStorage.setItem('tasks', JSON.stringify(tasks));
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

// Order the groups appear in the list
const GROUPS = [
  { key: 'overdue',   title: 'Overdue' },
  { key: 'today',     title: 'Today' },
  { key: 'upcoming',  title: 'Upcoming' },
  { key: 'completed', title: 'Completed' },
];

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

function isLocked(task) {
  return new Date(task.datetime) <= new Date();
}

// Overdue is derived, never stored: deadline passed and not completed.
function isOverdue(task) {
  return !task.completed && isLocked(task);
}

function getStatus(task) {
  if (task.completed) return 'Completed';
  return isOverdue(task) ? 'Overdue' : 'Active';
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

function renderTasks(filtered = tasks) {
  taskListEl.innerHTML = '';

  if (filtered.length === 0) {
    emptyStateEl.querySelector('p').textContent = tasks.length
      ? 'No tasks match your filters'
      : 'No tasks yet, click on the + to add one';
    emptyStateEl.style.display = 'block';
    return;
  }

  emptyStateEl.style.display = 'none';

  // One header per group, only for groups that have tasks
  GROUPS.forEach(group => {
    const groupTasks = filtered
      .filter(t => getGroup(t) === group.key)
      .sort(compareTasks);
    if (groupTasks.length === 0) return;

    const header = document.createElement('h2');
    header.className = `group-header group-${group.key}`;
    header.innerHTML = `${group.title} <span class="group-count">${groupTasks.length}</span>`;
    taskListEl.appendChild(header);

    groupTasks.forEach(task => taskListEl.appendChild(renderTaskRow(task)));
  });

  lucide.createIcons();
}

function renderTaskRow(task) {
  const row = document.createElement('div');
  const locked = isLocked(task);
  const overdue = isOverdue(task);

  row.className = 'task-row'
    + (task.completed ? ' completed' : '')
    + (overdue ? ' overdue' : '')
    + (selectedIds.has(task.id) ? ' selected' : '');
  row.dataset.id = task.id;

  row.innerHTML = `
    <div class="task-info">
      <span class="task-name">${escapeHTML(task.name)}</span>
      <span class="task-date" title="${formatFullDate(task.datetime)}">${formatDate(task.datetime)}</span>
      <span class="task-relative${overdue ? ' task-overdue' : ''}" title="${formatFullDate(task.datetime)}">${formatRelative(task)}</span>
      <span class="task-label" style="background-color: ${getLabelColor(task.label)}">
        ${escapeHTML(task.label)}
      </span>
      <span class="task-priority priority-${task.priority}"></span>
    </div>
    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} ${locked ? 'disabled title="Deadline passed — locked"' : ''} />
  `;

  return row;
}

function formatDate(datetime) {
  if (!datetime) return '';
  const d = new Date(datetime);
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// Exact timestamp for the tooltip
function formatFullDate(datetime) {
  if (!datetime) return '';
  return new Date(datetime).toLocaleString('en-GB', {
    dateStyle: 'full', timeStyle: 'short'
  });
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
  if (minutes < 1) amount = '<1 min';
  else if (minutes < 60) amount = `${minutes} min`;
  else if (hours < 24) amount = `${hours} h`;
  else amount = `${days} ${days === 1 ? 'day' : 'days'}`;

  if (diff > 0) return `in ${amount}`;
  return isOverdue(task) ? `overdue by ${amount}` : `${amount} ago`;
}

// Updates the relative labels in place, so selection and hover stay put
function refreshRelativeTimes() {
  taskListEl.querySelectorAll('.task-row').forEach(row => {
    const task = tasks.find(t => t.id === row.dataset.id);
    if (task) row.querySelector('.task-relative').textContent = formatRelative(task);
  });
}

// Dark enough for white pill text (at least 5:1)
function getLabelColor(label) {
  const colors = {
    university: '#2563EB',
    work:       '#C2410C',
    personal:   '#9333EA',
    health:     '#15803D',
  };
  return colors[label] || '#6B7280';
}

// ─── MODAL ───────────────────────────────────────────

const modalOverlay      = document.getElementById('modal-overlay');
const modalTitle        = document.getElementById('modal-title');
const inputName         = document.getElementById('input-name');
const inputDatetime     = document.getElementById('input-datetime');
const inputLabel        = document.getElementById('input-label');
const inputCustomLabel  = document.getElementById('input-custom-label');
const customLabelGroup  = document.getElementById('custom-label-group');
const inputPriority     = document.getElementById('input-priority');
const btnAdd            = document.getElementById('btn-add');

let editingId = null;
let modalOpener = null;

// Puts focus back on an element, or on the fallback if that element is
// gone, hidden or disabled
function restoreFocus(el, fallback) {
  const usable = el && el !== document.body && el.isConnected
    && !el.disabled && el.offsetParent !== null;
  (usable ? el : fallback).focus();
}

function openModal(task = null) {
  modalOpener = document.activeElement;
  editingId = task ? task.id : null;
  modalTitle.textContent = task ? 'Edit Task' : 'Add Task';

  inputName.value      = task ? task.name : '';
  inputDatetime.value  = task ? task.datetime : '';
  inputPriority.value  = task ? task.priority : 'low';

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

  modalOverlay.classList.add('active');
  inputName.focus();
}

function closeModal() {
  modalOverlay.classList.remove('active');
  editingId = null;
  restoreFocus(modalOpener, btnAdd);
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

// Short message at the bottom of the screen, with an optional action
// button (used for Undo). Hides itself after 6 seconds.
function showToast(message, actionLabel = null, onAction = null) {
  toastMessage.textContent = message;
  toastAction.textContent = actionLabel || '';
  toastAction.style.display = actionLabel ? '' : 'none';
  toastCallback = onAction;
  toastEl.classList.add('active');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 6000);
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

document.getElementById('btn-save').addEventListener('click', () => {
  const name = inputName.value.trim();
  const datetime = inputDatetime.value;

  if (!name) {
    inputName.style.borderColor = '#EF4444';
    inputName.focus();
    return;
  }
  inputName.style.borderColor = '';

  if (!datetime) {
    inputDatetime.style.borderColor = '#EF4444';
    inputDatetime.focus();
    return;
  }
  inputDatetime.style.borderColor = '';

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
  applyFilterAndSearch();
});

// The checkbox only toggles "completed"; clicking the row selects it.
taskListEl.addEventListener('change', (e) => {
  if (!e.target.classList.contains('task-checkbox')) return;
  const id = e.target.closest('.task-row').dataset.id;
  const isChecked = e.target.checked;
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
  btnEdit.title = count === 1 ? 'Edit task'
    : count === 0 ? 'Select one task to edit'
    : 'Select only one task to edit';

  btnDelete.disabled = count === 0;
  btnDelete.title = count === 0 ? 'Select tasks to delete'
    : count === 1 ? 'Delete task'
    : `Delete ${count} tasks`;
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
  tasks = tasks.filter(t => !selectedIds.has(t.id));
  selectedIds.clear();
  saveTasks();
  applyFilterAndSearch();

  const count = removed.length;
  showToast(`${count} ${count === 1 ? 'task' : 'tasks'} deleted`, 'Undo', () => {
    removed.forEach(({ task, index }) => tasks.splice(index, 0, task));
    saveTasks();
    updateOverdueTasks();
    applyFilterAndSearch();
  });
});

document.getElementById('btn-reload').addEventListener('click', () => {
  loadTasks();
  updateOverdueTasks();
  applyFilterAndSearch();
});

// ─── SEARCH ──────────────────────────────────────────

const searchBar   = document.getElementById('search-bar');
const searchInput = document.getElementById('search-input');
const btnSearch   = document.getElementById('btn-search');
let currentFilter = 'all';

function closeSearch() {
  searchBar.classList.remove('active');
  searchInput.value = '';
  applyFilterAndSearch();
  btnSearch.focus();
}

btnSearch.addEventListener('click', () => {
  if (searchBar.classList.contains('active')) {
    closeSearch();
  } else {
    searchBar.classList.add('active');
    searchInput.focus();
  }
});

document.getElementById('btn-close-search').addEventListener('click', closeSearch);

searchInput.addEventListener('input', applyFilterAndSearch);

// ─── FILTER ──────────────────────────────────────────

const filterBar = document.getElementById('filter-bar');

document.getElementById('btn-filter').addEventListener('click', () => {
  filterBar.classList.toggle('active');
});

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    applyFilterAndSearch();
  });
});

const filterLabel    = document.getElementById('filter-label');
const filterPriority = document.getElementById('filter-priority');

filterLabel.addEventListener('change', applyFilterAndSearch);
filterPriority.addEventListener('change', applyFilterAndSearch);

// Same capitalisation the label pills get from CSS
function formatLabel(label) {
  return label.replace(/(^|\s)\S/g, c => c.toUpperCase());
}

// Label options come from the labels in use, custom ones included. The
// selected label stays in the list even if no task uses it any more.
function updateLabelOptions() {
  const selected = filterLabel.value;
  const labels = [...new Set(tasks.map(t => t.label).filter(Boolean))];
  if (selected !== 'all' && !labels.includes(selected)) labels.push(selected);
  labels.sort((a, b) => a.localeCompare(b));

  filterLabel.innerHTML = '<option value="all">All labels</option>'
    + labels.map(l => `<option value="${escapeHTML(l)}">${escapeHTML(formatLabel(l))}</option>`).join('');
  filterLabel.value = selected;
}

function applyFilterAndSearch() {
  const query = searchInput.value.trim().toLowerCase();

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

  if (query) {
    filtered = filtered.filter(t => t.name.toLowerCase().includes(query));
  }

  // Tasks hidden by a filter or search (or deleted) leave the
  // selection, so Delete never removes a hidden task
  const visibleIds = new Set(filtered.map(t => t.id));
  selectedIds = new Set([...selectedIds].filter(id => visibleIds.has(id)));

  renderTasks(filtered);
  renderStats();
  updateActionButtons();
}

// ─── SORT ────────────────────────────────────────────

// Sorts inside each group. The choice is remembered.
const sortSelect = document.getElementById('sort-select');
sortSelect.value = currentSort;

sortSelect.addEventListener('change', () => {
  currentSort = sortSelect.value;
  localStorage.setItem('sort', currentSort);
  applyFilterAndSearch();
});

// ─── STATS ───────────────────────────────────────────

const statsText   = document.getElementById('stats-text');
const progressEl  = document.getElementById('progress');
const progressBar = document.getElementById('progress-bar');

// Progress for tasks due today, counted over all tasks (not the filtered list)
function renderStats() {
  const dueToday = tasks.filter(isDueToday);
  const done = dueToday.filter(t => t.completed).length;
  const percent = dueToday.length ? Math.round(done / dueToday.length * 100) : 0;

  statsText.textContent = dueToday.length
    ? `${done} of ${dueToday.length} done today`
    : 'Nothing due today';
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
  asideOverlay.classList.add('active');
  btnCloseAside.focus();
}

function closeAside() {
  asideOverlay.classList.remove('active');
  btnMenu.focus();
}

btnMenu.addEventListener('click', openAside);
btnCloseAside.addEventListener('click', closeAside);

asideOverlay.addEventListener('click', (e) => {
  if (e.target === asideOverlay) closeAside();
});

// Theme
// Every colour variable each theme sets. --bg-text, --bg-text-muted,
// --bg-line and --bg-focus are for things drawn straight on the page
// background.
const themes = {
  light: {
    '--bg':            '#eef3f4',
    '--bg-deep':       '#d9e4e6',
    '--surface':       '#0a7080',
    '--surface-hi':    '#0b7f91',
    '--text':          '#ffffff',
    '--text-muted':    '#d2eef2',
    '--bg-text':       '#16313a',
    '--bg-text-muted': '#4a636b',
    '--bg-line':       'rgba(0,0,0,0.2)',
    '--bg-focus':      '#0a7080',
  },
  dark: {
    '--bg':            '#846358',
    '--bg-deep':       '#5c4138',
    '--surface':       '#0a7285',
    '--surface-hi':    '#0c8599',
    '--text':          '#ffffff',
    '--text-muted':    '#ffdfeb',
    '--bg-text':       '#ffffff',
    '--bg-text-muted': '#ffe5ef',
    '--bg-line':       'rgba(255,255,255,0.2)',
    '--bg-focus':      '#ffd43b',
  },
};

const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

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
  const root = document.documentElement;
  if (theme === 'light' || theme === 'dark') {
    Object.entries(themes[theme]).forEach(([name, value]) => {
      root.style.setProperty(name, value);
    });
    // Browser and installed app title bar match the header
    document.querySelector('meta[name="theme-color"]')
      .setAttribute('content', themes[theme]['--surface']);
  } else {
    applyTheme(systemDark.matches ? 'dark' : 'light');
  }
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
  tasks.forEach(t => {
    if (t.completed || notifiedIds.has(t.id)) return;
    const due = new Date(t.datetime).getTime();
    if (due > now && due - now <= NOTIFY_BEFORE_MS) {
      new Notification('Task due soon', {
        body: `${t.name} is due at ${formatDate(t.datetime)}`
      });
      notifiedIds.add(t.id);
      changed = true;
    }
  });
  if (changed) saveNotifiedIds();
}

document.getElementById('btn-notif-settings').addEventListener('click', () => {
  showToast('To manage notifications, go to your browser settings and search for "Notifications" under site permissions for this page.');
});

// Export report
document.getElementById('btn-export').addEventListener('click', () => {
  const now = new Date().toLocaleString('en-GB');
  const completed = tasks.filter(t => t.completed).length;
  const overdue = tasks.filter(isOverdue).length;
  const active = tasks.length - completed - overdue;

  let report = `TASK MANAGER — EXPORT REPORT\n`;
  report += `Generated: ${now}\n`;
  report += `Total: ${tasks.length} | Active: ${active} | Overdue: ${overdue} | Completed: ${completed}\n`;
  report += `─────────────────────────────────────────\n\n`;

  tasks.forEach((t, i) => {
    report += `[${i + 1}] ${t.name}\n`;
    report += `    Date:     ${formatDate(t.datetime) || 'No date set'}\n`;
    report += `    Label:    ${t.label}\n`;
    report += `    Priority: ${t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}\n`;
    report += `    Status:   ${getStatus(t)}\n\n`;
  });

  downloadFile('task-report.txt', report, 'text/plain');
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
      showToast(`Restored ${tasks.length} tasks successfully.`);
    } catch {
      showToast('Invalid backup file. Please use a valid tasks-backup.json file.');
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

// ─── KEYBOARD ────────────────────────────────────────

// True while focus is in a field, so letter shortcuts don't fire
function isTypingTarget(el) {
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}

document.addEventListener('keydown', (e) => {
  // Esc closes whatever is on top: modal, then side menu, then search
  if (e.key === 'Escape') {
    if (modalOverlay.classList.contains('active')) closeModal();
    else if (asideOverlay.classList.contains('active')) closeAside();
    else if (searchBar.classList.contains('active')) closeSearch();
    return;
  }

  // N opens a new task, but not while typing, with Ctrl/Cmd/Alt held,
  // or while the modal or side menu is open
  if (e.key !== 'n' && e.key !== 'N') return;
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
  if (isTypingTarget(e.target)) return;
  if (modalOverlay.classList.contains('active') || asideOverlay.classList.contains('active')) return;
  e.preventDefault();
  openModal();
});

// Enter saves from a text or date field in the modal. Buttons and
// selects keep their own Enter behaviour, and a held key saves once.
modalOverlay.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || e.repeat || e.isComposing) return;
  if (!e.target.matches('input[type="text"], input[type="datetime-local"]')) return;
  e.preventDefault();
  document.getElementById('btn-save').click();
});

// ─── INIT ────────────────────────────────────────────

function init() {
  loadTasks();
  updateOverdueTasks();
  applyFilterAndSearch();
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
}

init();