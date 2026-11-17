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
    days: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
    daysShort: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
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
    'search.clear': 'Clear search',

    'smart.toggle': 'Smart search',
    'smart.short': 'Smart',
    'smart.title': 'Turn on smart search?',
    'smart.intro': 'Smart search also finds tasks by meaning, so “university stuff” finds “Finish assignment”.',
    'smart.size': 'One download of about {size} MB, best on Wi-Fi',
    'smart.offlineAfter': 'Works offline after that',
    'smart.private': 'Runs on this device. Your tasks never leave it.',
    'smart.notNow': 'Not now',
    'smart.download': 'Download {size} MB',
    'smart.downloading': 'Downloading smart search… {percent}%',
    'smart.preparing': 'Getting smart search ready…',
    'smart.progress': 'Smart search download',
    'smart.cancel': 'Cancel',
    'smart.ready': 'Smart search is ready and works offline.',
    'smart.cancelled': 'Smart search download cancelled.',
    'smart.offline': 'Smart search needs the internet for its first download. Normal search still works.',
    'smart.unavailable': 'Smart search can’t run on this device, so normal search is used.',
    'smart.hintOff': 'Finds tasks by meaning, on this device',
    'smart.hintOn': 'On, works offline',
    'smart.hintLoading': 'Starting…',
    'smart.hintDownloading': 'Downloading… {percent}%',

    'filter.all': 'All',
    'filter.active': 'Active',
    'filter.overdue': 'Overdue',
    'filter.completed': 'Completed',
    'filter.byStatus': 'Filter by status',
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
    'group.related': 'Similar in meaning',

    'empty.none': 'No tasks yet, click on the + to add one',
    'empty.filtered': 'No tasks match your filters',

    'task.locked': 'Deadline passed — locked',
    'task.markDone': 'Mark “{name}” as done',
    'task.related': 'Shown because its meaning is close to your search',

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
    'menu.notificationsHint': 'Reminders only arrive while the app is open, because there is no server to send them.',
    'menu.smartSearch': 'Smart search',
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

    // Guide: welcome card, tour (tour.js) and Help. Each guide.* pair is one
    // tour step and one Help topic.
    'menu.help': 'Help',
    'menu.tour': 'How to use',
    'menu.tourHint': 'A short tour of every feature',
    'menu.helpPanel': 'Help and tips',
    'menu.helpPanelHint': 'Answers, search and shortcuts',
    'menu.installHint': 'Steps for Android and iPhone',

    'welcome.title': 'Welcome to Task Manager',
    'welcome.titleAgain': 'Take the tour',
    'welcome.text': 'A short tour points out every feature, one step at a time. It takes about two minutes and you can leave whenever you like.',
    'welcome.samples': 'Add sample tasks for the tour',
    'welcome.samplesHint': 'Marked “Sample” and removed when the tour ends',
    'welcome.skip': 'Skip',
    'welcome.start': 'Take the tour',

    'tour.offer': 'New: a short tour of every feature.',
    'tour.later': 'You can take the tour any time from the menu, under How to use.',
    'tour.finished': 'Tour done. Replay it any time from the menu, under How to use.',
    'tour.failed': 'The tour could not load. Check your connection and try again.',
    'tour.step': 'Step {n} of {total}',
    'tour.back': 'Back',
    'tour.next': 'Next',
    'tour.finish': 'Finish',
    'tour.skip': 'Skip',
    'tour.skipLabel': 'Skip the tour',

    'sample.tag': 'Sample',
    'sample.bill': 'Pay the phone bill',
    'sample.report': 'Finish the project report',
    'sample.dentist': 'Book a dentist visit',
    'sample.reading': 'Read chapter 4',

    'guide.add.title': 'Add a task',
    'guide.add.text': 'Tap + to add a task. With a keyboard, just press N.',
    'guide.date.title': 'Pick a date',
    'guide.date.text': 'Type the date as DD/MM/YYYY, choose it in the calendar, or tap Today, Tomorrow or Next week.',
    'guide.time.title': 'Set the time',
    'guide.time.text': 'Type a time like 2:30 and choose AM or PM. The buttons below it fill in common times.',
    'guide.preview.title': 'Check before saving',
    'guide.preview.text': 'The line under the deadline shows when the task is due and warns you if that time has passed. Then pick a label and a priority and tap Save task.',
    'guide.select.title': 'Select a task',
    'guide.select.text': 'Click a task card to select it, and click again to unselect. Each card shows its deadline, label and priority.',
    'guide.edit.title': 'Edit, delete and undo',
    'guide.edit.text': 'With a task selected, the pencil edits it and the bin deletes it. Deleted one by mistake? Tap Undo in the message at the bottom.',
    'guide.complete.title': 'Mark it done',
    'guide.complete.text': 'Tick the box when a task is done. Untick it if you change your mind.',
    'guide.overdue.title': 'Overdue tasks lock',
    'guide.overdue.text': 'When a deadline passes, the task locks automatically: it gets a red bar and its box can no longer be ticked. Edit it to a later time to unlock it.',
    'guide.groups.title': 'Groups',
    'guide.groups.text': 'Tasks are grouped into Overdue, Today, Upcoming and Completed, and each group shows how many tasks it has.',
    'guide.progress.title': 'Today’s progress',
    'guide.progress.text': 'The card at the top counts how many of today’s tasks are done, and its bar fills up as you finish them.',
    'guide.filters.title': 'Filters',
    'guide.filters.text': 'The funnel button at the top shows the filters. Pick a status, a label or a priority; they work together and with search.',
    'guide.sort.title': 'Sort',
    'guide.sort.text': 'Order each group by deadline, soonest first, or by priority, highest first.',
    'guide.search.title': 'Search',
    'guide.search.text': 'Tap the magnifier and type to find tasks by name. Capitals and Arabic vowel marks don’t matter.',
    'guide.smart.title': 'Smart search',
    'guide.smart.text': 'Smart also finds tasks by meaning. The first time, it downloads about {size} MB once, then works offline. It runs on this device, so your tasks never leave it.',
    'guide.language.title': 'Language',
    'guide.language.text': 'Switch between English and Arabic. In Arabic the whole layout reads right to left.',
    'guide.theme.title': 'Theme',
    'guide.theme.text': 'Choose Light or Dark, or System to follow your device.',
    'guide.notifications.title': 'Reminders',
    'guide.notifications.text': 'Turn on notifications to get a reminder {minutes} minutes before a deadline. Your browser asks for permission first. Reminders only arrive while the app is open, because there is no server to send them.',
    'guide.export.title': 'Export a report',
    'guide.export.text': 'Download a readable text file listing every task with its deadline, label, priority and status.',
    'guide.backup.title': 'Backup and restore',
    'guide.backup.text': 'Save all tasks to a file and restore them later on this or another device. Restoring replaces the current list.',
    'guide.install.title': 'Install on your phone',
    'guide.install.text': 'On Android, open the Chrome menu (⋮) and tap Install app or Add to Home screen. On iPhone, tap Share in Safari, then Add to Home Screen.',
    'guide.shortcuts.title': 'Keyboard shortcuts',
    'guide.shortcuts.text': 'N adds a task, Enter saves it and Esc closes a window, the menu or search. In this tour, use the arrow keys, Enter and Esc.',
    'guide.help.title': 'Help is always here',
    'guide.help.text': 'Replay this tour from How to use, or open Help and tips for short answers, a search box and shortcuts.',

    'help.title': 'Help and tips',
    'help.search': 'Search help',
    'help.tips': 'Quick tips',
    'help.topics': 'How it works',
    'help.keys': 'Keyboard shortcuts',
    'help.none': 'Nothing in Help matches your search.',
    'help.tip.select': 'Click a task card to select it.',
    'help.tip.locked': 'Overdue tasks lock automatically.',
    'help.tip.new': 'Press N to add a task from anywhere.',
    'help.tip.undo': 'Deleted a task by mistake? Tap Undo straight away.',
    'help.tip.label': 'Choose Other as the label to type your own.',
    'help.tip.reload': 'The circular arrow reloads your saved tasks, for example after a change in another tab.',
    'help.tip.backup': 'Tasks are kept only in this browser, so make a backup now and then.',
    'help.key.arrows': 'Arrow keys',
    'help.key.calendar': 'Move between days in the calendar',
    'help.key.month': 'Previous or next month in the calendar',
    'help.key.tour': 'Back or next in the tour',
    // The tour's back and next keys, in reading order
    'help.key.back': '←',
    'help.key.next': '→',
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
    'search.clear': 'مسح البحث',

    'smart.toggle': 'البحث الذكي',
    'smart.short': 'ذكي',
    'smart.title': 'تفعيل البحث الذكي؟',
    'smart.intro': 'يجد البحث الذكي المهام بمعناها أيضًا، فالبحث عن «أشياء الجامعة» يجد «واجب الرياضيات».',
    'smart.size': 'تنزيل لمرة واحدة بحجم {size} ميغابايت تقريبًا، ويُفضَّل عبر واي فاي',
    'smart.offlineAfter': 'يعمل بعدها دون اتصال بالإنترنت',
    'smart.private': 'يعمل على جهازك، ولا تغادره مهامك أبدًا.',
    'smart.notNow': 'ليس الآن',
    'smart.download': 'تنزيل {size} ميغابايت',
    'smart.downloading': 'جارٍ تنزيل البحث الذكي… {percent}%',
    'smart.preparing': 'جارٍ تجهيز البحث الذكي…',
    'smart.progress': 'تنزيل البحث الذكي',
    'smart.cancel': 'إلغاء',
    'smart.ready': 'البحث الذكي جاهز ويعمل دون إنترنت.',
    'smart.cancelled': 'أُلغي تنزيل البحث الذكي.',
    'smart.offline': 'يحتاج البحث الذكي إلى الإنترنت لتنزيله أول مرة. البحث العادي يعمل كالمعتاد.',
    'smart.unavailable': 'لا يمكن تشغيل البحث الذكي على هذا الجهاز، لذا يُستخدم البحث العادي.',
    'smart.hintOff': 'يجد المهام بمعناها، على جهازك',
    'smart.hintOn': 'مفعّل، ويعمل دون إنترنت',
    'smart.hintLoading': 'جارٍ التشغيل…',
    'smart.hintDownloading': 'جارٍ التنزيل… {percent}%',

    'filter.all': 'الكل',
    'filter.active': 'النشطة',
    'filter.overdue': 'المتأخرة',
    'filter.completed': 'المكتملة',
    'filter.byStatus': 'التصفية حسب الحالة',
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

    'stats.done': 'تم إنجاز {done} من {total} اليوم',
    'stats.none': 'لا مهام مستحقة اليوم',
    'stats.label': 'إنجاز اليوم',
    'sort.by': 'ترتيب حسب',
    'sort.deadline': 'الموعد',
    'sort.priority': 'الأولوية',

    'group.overdue': 'المتأخرة',
    'group.today': 'اليوم',
    'group.upcoming': 'القادمة',
    'group.completed': 'المكتملة',
    'group.related': 'قريبة في المعنى',

    'empty.none': 'لا توجد مهام بعد. اضغط + لإضافة مهمة.',
    'empty.filtered': 'لا توجد مهام مطابقة للتصفية',

    'task.locked': 'انتهى الموعد، المهمة مقفلة',
    'task.markDone': 'تحديد «{name}» كمكتملة',
    'task.related': 'ظهرت لأن معناها قريب من بحثك',

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
    // An example date: Arabic words would run right to left inside the
    // left-to-right date field, the opposite order to a typed date
    'field.datePlaceholder': '{example}',
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
    'deadline.clockChange': ' (بسبب تغيير التوقيت، سيُحفظ الوقت {real} بدلًا من {typed})',
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
    'menu.notificationsHint': 'تصل التذكيرات فقط والتطبيق مفتوح، لأنه لا يوجد خادم يرسلها.',
    'menu.smartSearch': 'البحث الذكي',
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

    'menu.help': 'المساعدة',
    'menu.tour': 'طريقة الاستخدام',
    'menu.tourHint': 'جولة قصيرة على كل الميزات',
    'menu.helpPanel': 'المساعدة والنصائح',
    'menu.helpPanelHint': 'إجابات وبحث واختصارات',
    'menu.installHint': 'خطوات أندرويد وآيفون',

    'welcome.title': 'أهلًا بك في مدير المهام',
    'welcome.titleAgain': 'جولة في التطبيق',
    'welcome.text': 'جولة قصيرة تعرّفك على كل ميزة خطوة بخطوة. تستغرق دقيقتين تقريبًا، ويمكنك إنهاؤها متى شئت.',
    'welcome.samples': 'إضافة مهام تجريبية للجولة',
    'welcome.samplesHint': 'تظهر بعلامة «مثال» وتُحذف عند انتهاء الجولة',
    'welcome.skip': 'تخطي',
    'welcome.start': 'ابدأ الجولة',

    'tour.offer': 'جديد: جولة قصيرة تعرّفك على كل الميزات.',
    'tour.later': 'يمكنك بدء الجولة في أي وقت من القائمة عبر «طريقة الاستخدام».',
    'tour.finished': 'انتهت الجولة. يمكنك إعادتها في أي وقت من القائمة عبر «طريقة الاستخدام».',
    'tour.failed': 'تعذّر تحميل الجولة. تحقّق من اتصالك وحاول مرة أخرى.',
    'tour.step': 'الخطوة {n} من {total}',
    'tour.back': 'السابق',
    'tour.next': 'التالي',
    'tour.finish': 'إنهاء',
    'tour.skip': 'تخطي',
    'tour.skipLabel': 'تخطي الجولة',

    'sample.tag': 'مثال',
    'sample.bill': 'دفع فاتورة الهاتف',
    'sample.report': 'إنهاء تقرير المشروع',
    'sample.dentist': 'حجز موعد عند طبيب الأسنان',
    'sample.reading': 'قراءة الفصل الرابع',

    'guide.add.title': 'إضافة مهمة',
    'guide.add.text': 'اضغط + لإضافة مهمة، أو اضغط N على لوحة المفاتيح.',
    'guide.date.title': 'اختيار التاريخ',
    'guide.date.text': 'اكتب التاريخ بصيغة يوم/شهر/سنة، أو اختره من التقويم، أو اضغط «اليوم» أو «غدًا» أو «بعد أسبوع».',
    'guide.time.title': 'تحديد الوقت',
    'guide.time.text': 'اكتب الوقت مثل 2:30 واختر ص أو م، والأزرار تحته تضع أوقاتًا شائعة بضغطة واحدة.',
    'guide.preview.title': 'المراجعة قبل الحفظ',
    'guide.preview.text': 'يعرض السطر تحت الموعد متى تستحق المهمة، وينبّهك إن كان الوقت قد مضى. ثم اختر التصنيف والأولوية واضغط «حفظ المهمة».',
    'guide.select.title': 'تحديد مهمة',
    'guide.select.text': 'اضغط على بطاقة المهمة لتحديدها، واضغط مرة أخرى لإلغاء التحديد. تعرض كل بطاقة موعدها وتصنيفها وأولويتها.',
    'guide.edit.title': 'التعديل والحذف والتراجع',
    'guide.edit.text': 'بعد تحديد مهمة، يعدّلها زر القلم ويحذفها زر سلة المهملات. حذفتها خطأً؟ اضغط «تراجع» في الرسالة أسفل الشاشة.',
    'guide.complete.title': 'إنجاز المهمة',
    'guide.complete.text': 'ضع علامة في المربع عند إنجاز المهمة، وأزلها إن غيّرت رأيك.',
    'guide.overdue.title': 'المهام المتأخرة تُقفَل',
    'guide.overdue.text': 'عندما يمضي الموعد تُقفَل المهمة تلقائيًا: يظهر عليها شريط أحمر ولا يعود مربعها قابلًا للتحديد. عدّل موعدها إلى وقت لاحق لفتحها.',
    'guide.groups.title': 'المجموعات',
    'guide.groups.text': 'تُجمَع المهام في: المتأخرة واليوم والقادمة والمكتملة، وتعرض كل مجموعة عدد مهامها.',
    'guide.progress.title': 'إنجاز اليوم',
    'guide.progress.text': 'تَعُدّ البطاقة في الأعلى ما أنجزته من مهام اليوم، ويمتلئ شريطها كلما أنهيت مهمة.',
    'guide.filters.title': 'التصفية',
    'guide.filters.text': 'يُظهر زر التصفية في الأعلى خيارات التصفية. اختر الحالة أو التصنيف أو الأولوية، فهي تعمل معًا ومع البحث.',
    'guide.sort.title': 'الترتيب',
    'guide.sort.text': 'رتّب كل مجموعة حسب الموعد، الأقرب أولًا، أو حسب الأولوية، الأعلى أولًا.',
    'guide.search.title': 'البحث',
    'guide.search.text': 'اضغط زر البحث واكتب لتجد المهام بأسمائها، ولا يتأثر البحث بحالة الأحرف الإنجليزية ولا بالتشكيل.',
    'guide.smart.title': 'البحث الذكي',
    'guide.smart.text': 'يجد زر «ذكي» المهام بمعناها أيضًا. يُنزَّل أول مرة فقط بحجم {size} ميغابايت تقريبًا، ثم يعمل دون إنترنت. ويعمل على جهازك، فلا تغادره مهامك أبدًا.',
    'guide.language.title': 'اللغة',
    'guide.language.text': 'بدّل بين العربية والإنجليزية. وفي العربية تصبح الواجهة كلها من اليمين إلى اليسار.',
    'guide.theme.title': 'المظهر',
    'guide.theme.text': 'اختر فاتحًا أو داكنًا، أو «حسب النظام» ليتبع إعداد جهازك.',
    'guide.notifications.title': 'التذكيرات',
    'guide.notifications.text': 'فعّل الإشعارات ليصلك تذكير قبل الموعد بـ{minutes} دقيقة. سيطلب المتصفح إذنك أولًا. تصل التذكيرات فقط والتطبيق مفتوح، لأنه لا يوجد خادم يرسلها.',
    'guide.export.title': 'تصدير تقرير',
    'guide.export.text': 'نزّل ملفًا نصيًا مقروءًا يضم كل مهامك مع مواعيدها وتصنيفاتها وأولوياتها وحالاتها.',
    'guide.backup.title': 'النسخ الاحتياطي والاستعادة',
    'guide.backup.text': 'احفظ كل مهامك في ملف واستعدها لاحقًا على هذا الجهاز أو غيره. الاستعادة تستبدل القائمة الحالية.',
    'guide.install.title': 'التثبيت على هاتفك',
    'guide.install.text': 'في أندرويد، افتح قائمة كروم (⋮) واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية». وفي آيفون، اضغط «مشاركة» في سفاري ثم «إضافة إلى الشاشة الرئيسية».',
    'guide.shortcuts.title': 'اختصارات لوحة المفاتيح',
    'guide.shortcuts.text': 'N لإضافة مهمة، وEnter لحفظها، وEsc لإغلاق النافذة أو القائمة أو البحث. وفي هذه الجولة استخدم الأسهم وEnter وEsc.',
    'guide.help.title': 'المساعدة هنا دائمًا',
    'guide.help.text': 'أعِد هذه الجولة من «طريقة الاستخدام»، أو افتح «المساعدة والنصائح» لتجد إجابات قصيرة ومربع بحث واختصارات.',

    'help.title': 'المساعدة والنصائح',
    'help.search': 'ابحث في المساعدة',
    'help.tips': 'نصائح سريعة',
    'help.topics': 'كيف تعمل الميزات',
    'help.keys': 'اختصارات لوحة المفاتيح',
    'help.none': 'لا يوجد في المساعدة ما يطابق بحثك.',
    'help.tip.select': 'اضغط على بطاقة المهمة لتحديدها.',
    'help.tip.locked': 'المهام المتأخرة تُقفَل تلقائيًا.',
    'help.tip.new': 'اضغط N لإضافة مهمة من أي مكان.',
    'help.tip.undo': 'حذفت مهمة خطأً؟ اضغط «تراجع» فورًا.',
    'help.tip.label': 'اختر «أخرى» في التصنيف لتكتب تصنيفك الخاص.',
    'help.tip.reload': 'زر السهم الدائري يعيد تحميل مهامك المحفوظة، مثلًا بعد تغييرها في تبويب آخر.',
    'help.tip.backup': 'مهامك محفوظة في هذا المتصفح فقط، فاحفظ نسخة احتياطية من حين لآخر.',
    'help.key.arrows': 'الأسهم',
    'help.key.calendar': 'التنقل بين الأيام في التقويم',
    'help.key.month': 'الشهر السابق أو التالي في التقويم',
    'help.key.tour': 'الخطوة السابقة أو التالية في الجولة',
    'help.key.back': '→',
    'help.key.next': '←',
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
