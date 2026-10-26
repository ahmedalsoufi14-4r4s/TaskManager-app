// ─── I18N ────────────────────────────────────────────
// Every UI string in English and Arabic, and the helpers that pick the
// right one. Task names and custom labels are never translated.

// Western digits (0-9) by default. Set to true to show Arabic-Indic
// digits (٠-٩) in Arabic; every displayed number goes through
// formatDigits() below.
const USE_ARABIC_DIGITS = false;

// Each language written in its own script, for the switch buttons
const LANGUAGE_NAMES = { en: 'English', ar: 'العربية' };

// Month and day names, date order and the first day of the week
const DATE_NAMES = {
  en: {
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'],
    monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    daysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    daysNarrow: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    padDay: true,
    weekStart: 1,
  },
  ar: {
    months: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو',
      'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    monthsShort: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو',
      'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
    daysShort: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
    daysNarrow: ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'],
    padDay: false,
    weekStart: 0,
  },
};

// Plural entries are objects keyed by Intl.PluralRules category: English
// uses one/other, Arabic zero/one/two/few (3-10)/many (11-99)/other.
const STRINGS = {
  en: {
    'app.title': 'Task Manager',

    'header.add': 'Add task (N)',
    'header.delete.none': 'Select tasks to delete',
    'header.delete': { one: 'Delete task', other: 'Delete {count} tasks' },
    'header.edit.none': 'Select one task to edit',
    'header.edit.many': 'Select only one task to edit',
    'header.edit': 'Edit task',
    'header.reload': 'Reload tasks',
    'header.filter': 'Filter tasks',
    'header.search': 'Search tasks',
    'header.menu': 'Menu',
    'lang.switch': 'Switch to Arabic',

    'search.placeholder': 'Search tasks...',
    'search.close': 'Close search',

    'filter.all': 'All',
    'filter.active': 'Active',
    'filter.overdue': 'Overdue',
    'filter.completed': 'Completed',
    'filter.byLabel': 'Filter by label',
    'filter.allLabels': 'All labels',
    'filter.byPriority': 'Filter by priority',
    'filter.allPriorities': 'All priorities',

    'priority.high': 'High',
    'priority.medium': 'Medium',
    'priority.low': 'Low',
    'priorityDot.high': 'High priority',
    'priorityDot.medium': 'Medium priority',
    'priorityDot.low': 'Low priority',

    'label.university': 'University',
    'label.work': 'Work',
    'label.personal': 'Personal',
    'label.health': 'Health',
    'label.other': 'Other',
    'label.otherOption': 'Other (type your own)',

    'stats.done': '{done} of {total} done today',
    'stats.none': 'Nothing due today',
    'stats.label': 'Done today',
    'sort.by': 'Sort by',
    'sort.deadline': 'Deadline',
    'sort.priority': 'Priority',

    'group.overdue': 'Overdue',
    'group.today': 'Today',
    'group.upcoming': 'Upcoming',
    'group.completed': 'Completed',

    'empty.none': 'No tasks yet, click on the + to add one',
    'empty.filtered': 'No tasks match your filters',

    'task.locked': 'Deadline passed — locked',
    'task.markDone': 'Mark “{name}” as done',

    'rel.in': 'in {amount}',
    'rel.overdue': 'overdue by {amount}',
    'rel.ago': '{amount} ago',
    'rel.lessThanMinute': '<1 min',
    'unit.minute': { other: '{count} min' },
    'unit.hour': { other: '{count} h' },
    'unit.day': { one: '{count} day', other: '{count} days' },

    'date.short': '{day} {month} {year}, {time}',
    'date.long': '{weekday}, {day} {month} {year}',
    'date.full': '{date} at {time}',
    'date.monthYear': '{month} {year}',
    'time.clock': '{hours}:{minutes} {period}',
    'time.am': 'AM',
    'time.pm': 'PM',

    'modal.add': 'Add Task',
    'modal.edit': 'Edit Task',
    'modal.close': 'Close',
    'modal.cancel': 'Cancel',
    'modal.save': 'Save task',
    'field.name': 'Task name',
    'field.namePlaceholder': 'e.g. Finish assignment',
    'field.deadline': 'Deadline',
    'field.date': 'Date (DD/MM/YYYY)',
    'field.datePlaceholder': 'DD/MM/YYYY',
    'field.calendar': 'Choose date from calendar',
    'field.time': 'Time',
    'field.timePlaceholder': 'e.g. 2:30',
    'field.ampm': 'AM or PM',
    'field.label': 'Label',
    'field.customLabel': 'Custom label',
    'field.customLabelPlaceholder': 'Type your label',
    'field.priority': 'Priority',

    'calendar.label': 'Choose date',
    'calendar.prev': 'Previous month',
    'calendar.next': 'Next month',
    'quick.dates': 'Quick dates',
    'quick.today': 'Today',
    'quick.tomorrow': 'Tomorrow',
    'quick.nextWeek': 'Next week',
    'quick.times': 'Quick times',

    'deadline.pickBoth': 'Pick a date and a time',
    'deadline.pickDate': 'Pick a date',
    'deadline.pickTime': 'Pick a time',
    'deadline.preview': 'Due {weekday} {date} · {relative}',
    'deadline.clockChange': ' (clocks change, so {typed} becomes {real})',
    'deadline.past': 'This time has passed, so the task will be overdue right away.',

    'error.dateFormat': 'Enter the date as DD/MM/YYYY',
    'error.year': 'Year must be {min} or later',
    'error.month': 'Month must be between {from} and {to}',
    'error.day': 'Day must be between {from} and {to} for {month} {year}',
    'error.timeFormat': 'Enter a time like {example}',
    'error.time': 'Enter a time',

    'menu.title': 'Menu',
    'menu.close': 'Close menu',
    'menu.preferences': 'Preferences',
    'menu.theme': 'Theme',
    'menu.language': 'Language',
    'menu.notifications': 'Notifications',
    'menu.notificationSettings': 'Notification settings',
    'menu.exportBackup': 'Export & Backup',
    'menu.exportReport': 'Export report (.txt)',
    'menu.backup': 'Backup tasks (.json)',
    'menu.restore': 'Restore from backup',
    'menu.shortcuts': 'Shortcuts',
    'theme.system': 'System default',
    'theme.dark': 'Dark',
    'theme.light': 'Light',
    'shortcut.new': 'New task',
    'shortcut.save': 'Save task',
    'shortcut.close': 'Close window, menu or search',

    'toast.undo': 'Undo',
    'toast.deleted': { one: '{count} task deleted', other: '{count} tasks deleted' },
    'toast.restored': { one: 'Restored {count} task successfully.', other: 'Restored {count} tasks successfully.' },
    'toast.invalidBackup': 'Invalid backup file. Please use a valid tasks-backup.json file.',
    'toast.notificationHelp': 'To manage notifications, go to your browser settings and search for "Notifications" under site permissions for this page.',

    'notify.title': 'Task due soon',
    'notify.body': '{name} is due at {date}',

    'status.completed': 'Completed',
    'status.overdue': 'Overdue',
    'status.active': 'Active',

    'report.file': 'task-report.txt',
    'report.title': 'TASK MANAGER — EXPORT REPORT',
    'report.generated': 'Generated: {date}',
    'report.counts': 'Total: {total} | Active: {active} | Overdue: {overdue} | Completed: {completed}',
    'report.date': '    Date:     {value}',
    'report.label': '    Label:    {value}',
    'report.priority': '    Priority: {value}',
    'report.status': '    Status:   {value}',
    'report.noDate': 'No date set',
  },

  ar: {
    'app.title': 'مدير المهام',

    'header.add': 'إضافة مهمة (N)',
    'header.delete.none': 'حدد مهامًا لحذفها',
    'header.delete': {
      one: 'حذف المهمة', two: 'حذف المهمتين', few: 'حذف {count} مهام',
      many: 'حذف {count} مهمة', other: 'حذف {count} مهمة',
    },
    'header.edit.none': 'حدد مهمة واحدة لتعديلها',
    'header.edit.many': 'حدد مهمة واحدة فقط للتعديل',
    'header.edit': 'تعديل المهمة',
    'header.reload': 'إعادة تحميل المهام',
    'header.filter': 'تصفية المهام',
    'header.search': 'البحث في المهام',
    'header.menu': 'القائمة',
    'lang.switch': 'التبديل إلى الإنجليزية',

    'search.placeholder': 'ابحث في المهام…',
    'search.close': 'إغلاق البحث',

    'filter.all': 'الكل',
    'filter.active': 'النشطة',
    'filter.overdue': 'المتأخرة',
    'filter.completed': 'المكتملة',
    'filter.byLabel': 'التصفية حسب التصنيف',
    'filter.allLabels': 'كل التصنيفات',
    'filter.byPriority': 'التصفية حسب الأولوية',
    'filter.allPriorities': 'كل الأولويات',

    'priority.high': 'عالية',
    'priority.medium': 'متوسطة',
    'priority.low': 'منخفضة',
    'priorityDot.high': 'أولوية عالية',
    'priorityDot.medium': 'أولوية متوسطة',
    'priorityDot.low': 'أولوية منخفضة',

    'label.university': 'جامعة',
    'label.work': 'عمل',
    'label.personal': 'شخصي',
    'label.health': 'صحة',
    'label.other': 'أخرى',
    'label.otherOption': 'أخرى (اكتب تصنيفك)',

    'stats.done': '{done} من {total} منجزة اليوم',
    'stats.none': 'لا مهام مستحقة اليوم',
    'stats.label': 'إنجاز اليوم',
    'sort.by': 'ترتيب حسب',
    'sort.deadline': 'الموعد',
    'sort.priority': 'الأولوية',

    'group.overdue': 'المتأخرة',
    'group.today': 'اليوم',
    'group.upcoming': 'القادمة',
    'group.completed': 'المكتملة',

    'empty.none': 'لا توجد مهام بعد. اضغط + لإضافة مهمة.',
    'empty.filtered': 'لا توجد مهام مطابقة للتصفية',

    'task.locked': 'انتهى الموعد، المهمة مقفلة',
    'task.markDone': 'تحديد «{name}» كمكتملة',

    'rel.in': 'بعد {amount}',
    'rel.overdue': 'متأخرة منذ {amount}',
    'rel.ago': 'منذ {amount}',
    'rel.lessThanMinute': 'أقل من دقيقة',
    'unit.minute': {
      one: 'دقيقة', two: 'دقيقتين', few: '{count} دقائق', many: '{count} دقيقة', other: '{count} دقيقة',
    },
    'unit.hour': {
      one: 'ساعة', two: 'ساعتين', few: '{count} ساعات', many: '{count} ساعة', other: '{count} ساعة',
    },
    'unit.day': {
      one: 'يوم', two: 'يومين', few: '{count} أيام', many: '{count} يومًا', other: '{count} يوم',
    },

    'date.short': '{day} {month} {year}، {time}',
    'date.long': '{weekday}، {day} {month} {year}',
    'date.full': '{date} الساعة {time}',
    'date.monthYear': '{month} {year}',
    'time.clock': '{hours}:{minutes} {period}',
    'time.am': 'ص',
    'time.pm': 'م',

    'modal.add': 'إضافة مهمة',
    'modal.edit': 'تعديل المهمة',
    'modal.close': 'إغلاق',
    'modal.cancel': 'إلغاء',
    'modal.save': 'حفظ المهمة',
    'field.name': 'اسم المهمة',
    'field.namePlaceholder': 'مثال: إنهاء الواجب',
    'field.deadline': 'الموعد النهائي',
    'field.date': 'التاريخ (يوم/شهر/سنة)',
    'field.datePlaceholder': 'يوم/شهر/سنة',
    'field.calendar': 'اختيار التاريخ من التقويم',
    'field.time': 'الوقت',
    'field.timePlaceholder': '2:30',
    'field.ampm': 'صباحًا أو مساءً',
    'field.label': 'التصنيف',
    'field.customLabel': 'تصنيف مخصص',
    'field.customLabelPlaceholder': 'اكتب التصنيف',
    'field.priority': 'الأولوية',

    'calendar.label': 'اختيار التاريخ',
    'calendar.prev': 'الشهر السابق',
    'calendar.next': 'الشهر التالي',
    'quick.dates': 'تواريخ سريعة',
    'quick.today': 'اليوم',
    'quick.tomorrow': 'غدًا',
    'quick.nextWeek': 'بعد أسبوع',
    'quick.times': 'أوقات سريعة',

    'deadline.pickBoth': 'اختر التاريخ والوقت',
    'deadline.pickDate': 'اختر التاريخ',
    'deadline.pickTime': 'اختر الوقت',
    'deadline.preview': 'الموعد: {weekday} {date} · {relative}',
    'deadline.clockChange': ' (بسبب تغيير التوقيت، تصبح {typed} هي {real})',
    'deadline.past': 'هذا الوقت مضى، لذا ستصبح المهمة متأخرة فور حفظها.',

    'error.dateFormat': 'اكتب التاريخ بصيغة يوم/شهر/سنة',
    'error.year': 'يجب أن تكون السنة {min} أو بعدها',
    'error.month': 'يجب أن يكون الشهر بين {from} و{to}',
    'error.day': 'يجب أن يكون اليوم بين {from} و{to} في {month} {year}',
    'error.timeFormat': 'اكتب الوقت مثل {example}',
    'error.time': 'اكتب الوقت',

    'menu.title': 'القائمة',
    'menu.close': 'إغلاق القائمة',
    'menu.preferences': 'التفضيلات',
    'menu.theme': 'المظهر',
    'menu.language': 'اللغة',
    'menu.notifications': 'الإشعارات',
    'menu.notificationSettings': 'إعدادات الإشعارات',
    'menu.exportBackup': 'التصدير والنسخ الاحتياطي',
    'menu.exportReport': 'تصدير تقرير نصي',
    'menu.backup': 'حفظ نسخة احتياطية',
    'menu.restore': 'استعادة نسخة احتياطية',
    'menu.shortcuts': 'اختصارات لوحة المفاتيح',
    'theme.system': 'حسب النظام',
    'theme.dark': 'داكن',
    'theme.light': 'فاتح',
    'shortcut.new': 'مهمة جديدة',
    'shortcut.save': 'حفظ المهمة',
    'shortcut.close': 'إغلاق النافذة أو القائمة أو البحث',

    'toast.undo': 'تراجع',
    'toast.deleted': {
      zero: 'لم تُحذف أي مهمة', one: 'تم حذف مهمة واحدة', two: 'تم حذف مهمتين',
      few: 'تم حذف {count} مهام', many: 'تم حذف {count} مهمة', other: 'تم حذف {count} مهمة',
    },
    'toast.restored': {
      zero: 'اكتملت الاستعادة، ولا توجد مهام في الملف.', one: 'تمت استعادة مهمة واحدة بنجاح.',
      two: 'تمت استعادة مهمتين بنجاح.', few: 'تمت استعادة {count} مهام بنجاح.',
      many: 'تمت استعادة {count} مهمة بنجاح.', other: 'تمت استعادة {count} مهمة بنجاح.',
    },
    'toast.invalidBackup': 'ملف النسخة الاحتياطية غير صالح. اختر ملف نسخة احتياطية من هذا التطبيق.',
    'toast.notificationHelp': 'لإدارة الإشعارات، افتح إعدادات المتصفح وابحث عن «الإشعارات» ضمن أذونات هذا الموقع.',

    'notify.title': 'موعد مهمة يقترب',
    'notify.body': 'موعد «{name}»: {date}',

    'status.completed': 'مكتملة',
    'status.overdue': 'متأخرة',
    'status.active': 'نشطة',

    'report.file': 'تقرير-المهام.txt',
    'report.title': 'مدير المهام — تقرير المهام',
    'report.generated': 'تاريخ الإنشاء: {date}',
    'report.counts': 'الإجمالي: {total} | النشطة: {active} | المتأخرة: {overdue} | المكتملة: {completed}',
    'report.date': '    التاريخ:  {value}',
    'report.label': '    التصنيف:  {value}',
    'report.priority': '    الأولوية: {value}',
    'report.status': '    الحالة:   {value}',
    'report.noDate': 'بلا موعد',
  },
};

// Saved choice first, then Arabic for an Arabic browser, else English
function detectLanguage() {
  const saved = localStorage.getItem('lang');
  if (saved && STRINGS[saved]) return saved;
  const browser = (navigator.languages && navigator.languages[0]) || navigator.language || '';
  return browser.toLowerCase().startsWith('ar') ? 'ar' : 'en';
}

let currentLang = detectLanguage();

function dateNames() {
  return DATE_NAMES[currentLang];
}

// The one place numbers are shaped for display
function formatDigits(value) {
  const text = String(value);
  if (!USE_ARABIC_DIGITS || currentLang !== 'ar') return text;
  return text.replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

// Arabic-Indic (٠-٩) and Persian (۰-۹) digits typed by the user become 0-9
function normalizeDigits(text) {
  return text.replace(/[٠-٩۰-۹]/g, d => String(d.charCodeAt(0) & 0xF));
}

const pluralRules = {};

function pluralCategory(count) {
  pluralRules[currentLang] = pluralRules[currentLang] || new Intl.PluralRules(currentLang);
  return pluralRules[currentLang].select(count);
}

// t('toast.deleted', { count: 3 }). Number params are shaped by
// formatDigits; string params (task names, dates) are used as given.
function t(key, params = {}) {
  let entry = STRINGS[currentLang][key] ?? STRINGS.en[key] ?? key;
  if (typeof entry === 'object') entry = entry[pluralCategory(params.count)] ?? entry.other;
  return entry.replace(/\{(\w+)\}/g, (match, name) => {
    if (!(name in params)) return match;
    const value = params[name];
    return typeof value === 'number' ? formatDigits(value) : String(value);
  });
}

// Fills every element marked with data-i18n (text) or data-i18n-title,
// -placeholder, -aria-label and -abbr (attributes)
function translatePage() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  [['i18nTitle', 'title'], ['i18nPlaceholder', 'placeholder'],
    ['i18nAriaLabel', 'aria-label'], ['i18nAbbr', 'abbr']].forEach(([data, attr]) => {
    document.querySelectorAll(`[data-${data.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}]`).forEach(el => {
      el.setAttribute(attr, t(el.dataset[data]));
    });
  });
}
