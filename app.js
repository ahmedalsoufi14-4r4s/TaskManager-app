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

function generateId() {
  return Date.now().toString();
}

// ─── RENDER ──────────────────────────────────────────

const taskListEl = document.getElementById('task-list');
const emptyStateEl = document.getElementById('empty-state');

let selectedIds = new Set();

function isLocked(task) {
  return new Date(task.datetime) <= new Date();
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
    emptyStateEl.style.display = 'block';
    return;
  }

  emptyStateEl.style.display = 'none';

  filtered.forEach(task => {
    const row = document.createElement('div');
    row.className = 'task-row'
      + (task.completed ? ' completed' : '')
      + (selectedIds.has(task.id) ? ' selected' : '');
    row.dataset.id = task.id;

    const locked = isLocked(task);

    row.innerHTML = `
      <div class="task-info">
        <span class="task-name">${escapeHTML(task.name)}</span>
        <span class="task-date">${formatDate(task.datetime)}</span>
        <span class="task-label" style="background-color: ${getLabelColor(task.label)}">
          ${escapeHTML(task.label)}
        </span>
        <span class="task-priority priority-${task.priority}"></span>
      </div>
      <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} ${locked ? 'disabled title="Deadline passed — locked"' : ''} />
    `;

    taskListEl.appendChild(row);
  });

  lucide.createIcons();
}

function formatDate(datetime) {
  if (!datetime) return '';
  const d = new Date(datetime);
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function getLabelColor(label) {
  const colors = {
    university: '#3B82F6',
    work:       '#F97316',
    personal:   '#A855F7',
    health:     '#22C55E',
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

let editingId = null;

function openModal(task = null) {
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
}

inputLabel.addEventListener('change', () => {
  customLabelGroup.style.display =
    inputLabel.value === 'other' ? 'flex' : 'none';
});

// ─── EVENTS ──────────────────────────────────────────

document.getElementById('btn-add').addEventListener('click', () => openModal());

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

// The checkbox only ever toggles "completed" — it no longer drives
// selection for edit/delete.
taskListEl.addEventListener('change', (e) => {
  if (!e.target.classList.contains('task-checkbox')) return;
  const id = e.target.closest('.task-row').dataset.id;
  const isChecked = e.target.checked;
  tasks = tasks.map(t => t.id === id ? { ...t, completed: isChecked } : t);
  saveTasks();
  applyFilterAndSearch();
});

document.getElementById('btn-edit').addEventListener('click', () => {
  if (selectedIds.size === 0) {
    alert('Click a task first to select it.');
    return;
  }
  if (selectedIds.size > 1) {
    alert('Select only one task to edit.');
    return;
  }
  const id = [...selectedIds][0];
  const task = tasks.find(t => t.id === id);
  if (task) openModal(task);
});

document.getElementById('btn-delete').addEventListener('click', () => {
  if (selectedIds.size === 0) return;
  tasks = tasks.filter(t => !selectedIds.has(t.id));
  selectedIds.clear();
  saveTasks();
  applyFilterAndSearch();
});

document.getElementById('btn-reload').addEventListener('click', () => {
  loadTasks();
  updateOverdueTasks();
  applyFilterAndSearch();
});

// ─── SEARCH ──────────────────────────────────────────

const searchBar   = document.getElementById('search-bar');
const searchInput = document.getElementById('search-input');
let currentFilter = 'all';

document.getElementById('btn-search').addEventListener('click', () => {
  searchBar.classList.toggle('active');
  if (searchBar.classList.contains('active')) {
    searchInput.focus();
  } else {
    searchInput.value = '';
    applyFilterAndSearch();
  }
});

document.getElementById('btn-close-search').addEventListener('click', () => {
  searchBar.classList.remove('active');
  searchInput.value = '';
  applyFilterAndSearch();
});

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

function applyFilterAndSearch() {
  const query = searchInput.value.trim().toLowerCase();

  let filtered = tasks;

  if (currentFilter === 'active') {
    filtered = filtered.filter(t => !t.completed);
  } else if (currentFilter === 'completed') {
    filtered = filtered.filter(t => t.completed);
  }

  if (query) {
    filtered = filtered.filter(t => t.name.toLowerCase().includes(query));
  }

  renderTasks(filtered);
}

// ─── OVERDUE AUTO-LOCK ───────────────────────────────

// Any task whose deadline has passed is auto-marked completed and its
// checkbox gets disabled in renderTasks() (see isLocked()).
function updateOverdueTasks() {
  const now = new Date();
  let changed = false;
  tasks = tasks.map(t => {
    if (!t.completed && new Date(t.datetime) <= now) {
      changed = true;
      return { ...t, completed: true };
    }
    return t;
  });
  if (changed) saveTasks();
  return changed;
}

// ─── ASIDE ───────────────────────────────────────────

const asideOverlay = document.getElementById('aside-overlay');

function openAside() { asideOverlay.classList.add('active'); }
function closeAside() { asideOverlay.classList.remove('active'); }

document.getElementById('btn-menu').addEventListener('click', openAside);
document.getElementById('btn-close-aside').addEventListener('click', closeAside);

asideOverlay.addEventListener('click', (e) => {
  if (e.target === asideOverlay) closeAside();
});

// Theme
const prefTheme = document.getElementById('pref-theme');
prefTheme.value = localStorage.getItem('theme') || 'system';
applyTheme(prefTheme.value);

prefTheme.addEventListener('change', () => {
  localStorage.setItem('theme', prefTheme.value);
  applyTheme(prefTheme.value);
});

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'light') {
    root.style.setProperty('--bg', '#f5f5f5');
    root.style.setProperty('--surface', '#0a7080');
    root.style.setProperty('--text', '#1e1e1e');
    root.style.setProperty('--text-muted', '#c2587e');
  } else if (theme === 'dark') {
    root.style.setProperty('--bg', '#846358');
    root.style.setProperty('--surface', '#0c8599');
    root.style.setProperty('--text', '#ffffff');
    root.style.setProperty('--text-muted', '#f783ac');
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
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

document.getElementById('btn-notif-settings').addEventListener('click', () => {
  alert('To manage notifications, go to your browser settings and search for "Notifications" under site permissions for this page.');
});

// Export report
document.getElementById('btn-export').addEventListener('click', () => {
  const now = new Date().toLocaleString('en-GB');
  const completed = tasks.filter(t => t.completed).length;
  const active = tasks.length - completed;

  let report = `TASK MANAGER — EXPORT REPORT\n`;
  report += `Generated: ${now}\n`;
  report += `Total: ${tasks.length} | Active: ${active} | Completed: ${completed}\n`;
  report += `─────────────────────────────────────────\n\n`;

  tasks.forEach((t, i) => {
    report += `[${i + 1}] ${t.name}\n`;
    report += `    Date:     ${formatDate(t.datetime) || 'No date set'}\n`;
    report += `    Label:    ${t.label}\n`;
    report += `    Priority: ${t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}\n`;
    report += `    Status:   ${t.completed ? 'Completed' : 'Active'}\n\n`;
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
      tasks = restored.map(t => ({ ...t, completed: t.completed ?? false }));
      selectedIds.clear();
      saveTasks();
      updateOverdueTasks();
      applyFilterAndSearch();
      closeAside();
      alert(`Restored ${tasks.length} tasks successfully.`);
    } catch {
      alert('Invalid backup file. Please use a valid tasks-backup.json file.');
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

// ─── INIT ────────────────────────────────────────────

function init() {
  loadTasks();
  updateOverdueTasks();
  applyFilterAndSearch();
  lucide.createIcons();
  // Re-check deadlines every 30s so a task locks itself the moment it
  // becomes overdue, without needing a manual reload.
  setInterval(() => {
    if (updateOverdueTasks()) applyFilterAndSearch();
  }, 30000);
  console.log('app loaded', tasks);
}

init();