// Persian (Farsi) Translations Dictionary for "کارهای جاواد"
const FA = {
  appName: 'کارهای جاواد',
  workspace: 'فضای کاری',
  tasks: 'کارها',
  notes: 'یادداشت‌ها',
  today: 'امروز',

  // PIN Lock Screen
  pinTitle: 'فضای اختصاصی',
  enterPin: 'رمز ورود را وارد کنید',
  pinSubtitle: 'رمز ۴ رقمی خود را وارد نمایید',
  wrongPin: 'رمز اشتباه است',
  unlockedToast: 'با موفقیت باز شد',

  // Categories (Internal IDs remain untouched: 'Armin Department', 'Gold Sassan', 'KhoshKam')
  categories: {
    'Armin Department': 'دپارتمان آرمین',
    'Gold Sassan': 'طلا ساسان',
    'KhoshKam': 'خوشکام'
  },
  categoryShort: {
    'Armin Department': 'آرمین',
    'Gold Sassan': 'طلا ساسان',
    'KhoshKam': 'خوشکام'
  },

  // Priorities
  priorities: {
    'urgent': 'فوری',
    'normal': 'عادی'
  },

  // Tabs & Filters
  all: 'همه',
  finished: 'انجام‌شده',
  allPriorities: 'همه اولویت‌ها',
  allFinished: 'همه انجام‌شده‌ها',

  // Task Add / Edit Modal
  newTask: 'افزودن کار جدید',
  editTask: 'ویرایش کار',
  categoryLabel: 'دسته‌بندی',
  priorityLabel: 'اولویت',
  titleLabel: 'عنوان',
  descLabel: 'توضیحات کار',
  titlePlaceholder: 'عنوان کار را بنویسید',
  descPlaceholder: 'کارهایت را اینجا بنویس...',
  cancel: 'انصراف',
  save: 'ذخیره',
  saveChanges: 'ذخیره تغییرات',
  close: 'بستن',

  // Task Details Modal
  taskDetails: 'جزئیات کار',
  createdDate: 'تاریخ ثبت',
  completedDate: 'تاریخ انجام',
  lastModified: 'آخرین ویرایش',
  status: 'وضعیت',
  statusInProgress: 'در حال انجام',
  statusCompleted: 'انجام شده',
  doneOn: 'انجام شده در',
  edit: 'ویرایش',
  delete: 'حذف',
  undo: 'بازگردانی',
  noDescProvided: 'توضیحاتی ثبت نشده است',

  // Notes
  newNote: 'یادداشت جدید',
  editNote: 'ویرایش یادداشت',
  noteDetails: 'جزئیات یادداشت',
  noteTitlePlaceholder: 'عنوان یادداشت...',
  noteContentPlaceholder: 'متن یادداشت را اینجا بنویسید...',
  searchNotesPlaceholder: 'جستجو در یادداشت‌ها...',
  personalMemo: 'یادداشت شخصی',
  createdDateNote: 'تاریخ ایجاد',
  lastEditedNote: 'آخرین ویرایش',

  // Delete Confirmation Modal
  confirmDeleteTitle: 'آیا از حذف مطمئن هستید؟',
  confirmDeleteDesc: 'این عملیات قابل بازگشت نخواهد بود.',
  confirmDeleteYes: 'بله، حذف شود',

  // Empty States
  emptyTasksAll: 'هنوز کاری ثبت نشده است',
  emptyTasksAllSub: 'دکمه + را لمس کنید تا اولین کار خود را اضافه کنید',
  emptyTasksFinished: 'هنوز کاری انجام نشده است',
  emptyTasksFinishedSub: 'کارهای تکمیل‌شده شما در این بخش بایگانی می‌شوند',
  emptyTasksFilter: 'کاری با این مشخصات یافت نشد',
  emptyTasksFilterSub: 'دسته‌بندی یا اولویت انتخابی را تغییر دهید',
  emptyNotes: 'هنوز یادداشتی ندارید',
  emptyNotesSub: 'ایده‌ها، برنامه‌ها و یادداشت‌های روزمره خود را بنویسید',
  emptyNotesSearch: 'یادداشتی با این عبارت پیدا نشد',

  // Toasts
  toastTaskSaved: 'کار ذخیره شد',
  toastTaskMovedFinished: 'به انجام‌شده‌ها منتقل شد',
  toastTaskRestored: 'کار بازگردانی شد',
  toastTaskUpdated: 'تغییرات کار ذخیره شد',
  toastTaskDeleted: 'حذف شد',
  toastNoteSaved: 'یادداشت ذخیره شد',
  toastNoteUpdated: 'یادداشت ویرایش شد',
  toastNoteDeleted: 'یادداشت حذف شد',
  toastWrongPin: 'رمز اشتباه است',

  // Form Validation Alerts
  valTitleRequired: 'لطفاً عنوان را وارد کنید',
  valCategoryRequired: 'لطفاً یک دسته‌بندی انتخاب کنید',
  valContentRequired: 'لطفاً متن یادداشت را وارد کنید'
};

// Persian Digits Converter: replaces 0-9 with ۰-۹
function toFaDigits(str) {
  if (str === null || str === undefined) return '';
  const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(str).replace(/[0-9]/g, w => faDigits[+w]);
}

// Persian Calendar Formatter (Jalali / Shamsi)
function formatFaDate(iso, withTime = true) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';

  try {
    const opts = {
      calendar: 'persian',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    if (withTime) {
      opts.hour = '2-digit';
      opts.minute = '2-digit';
      opts.hour12 = false;
    }
    const formatted = new Intl.DateTimeFormat('fa-IR-u-ca-persian', opts).format(d);
    return toFaDigits(formatted);
  } catch (e) {
    return toFaDigits(d.toLocaleDateString('fa-IR'));
  }
}

// Current day header formatted: e.g. "شنبه، ۱۹ مهر"
function formatFaCurrentDay() {
  const d = new Date();
  try {
    const formatted = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      calendar: 'persian',
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(d);
    return toFaDigits(formatted);
  } catch (e) {
    return toFaDigits(d.toLocaleDateString('fa-IR'));
  }
}

// Export to window
window.FA = FA;
window.toFaDigits = toFaDigits;
window.formatFaDate = formatFaDate;
window.formatFaCurrentDay = formatFaCurrentDay;
