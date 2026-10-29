(function () {
  'use strict';

  /* ==========================================================================
     STORAGE KEYS & CONSTANTS
     Internal keys and category/priority IDs remain identical to protect data.
     ========================================================================== */
  const CORRECT_PIN   = '2020';
  const PIN_EXPIRY    = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const SK_TASKS         = 'todo_tasks';
  const SK_NOTES         = 'todo_notes';
  const SK_PIN_TS        = 'todo_pin_ts';
  const SK_GEMINI_KEY    = 'todo_gemini_key';
  const SK_GEMINI_MODEL  = 'todo_gemini_model';
  const SK_GEMINI_BASE_URL = 'todo_gemini_base_url';
  const SK_CACHED_MODELS = 'todo_cached_models';
  const SK_AI_CHAT       = 'todo_ai_chat';

  /* ==========================================================================
     APP STATE
     ========================================================================== */
  let activeTab             = 'tasks';      // 'tasks' | 'notes' | 'ai'
  let activeCategory        = 'all';        // 'all' | 'Armin Department' | 'Gold Sassan' | 'KhoshKam' | 'Latifi Store' | 'finished'
  let activePriority        = 'all';        // 'all' | 'urgent' | 'normal'
  let activeFinishedCat     = 'all';        // 'all' | 'Armin Department' | 'Gold Sassan' | 'KhoshKam' | 'Latifi Store'
  let activeNoteCategory    = 'all';        // 'all' | 'Armin Department' | 'Gold Sassan' | 'KhoshKam' | 'Latifi Store' | 'none'

  let pinInput              = '';
  let openTaskId            = null;
  let openNoteId            = null;

  let selectedAddCategory   = '';
  let selectedAddPriority   = 'normal';
  let selectedNoteCategory  = '';

  let notesSearchQuery      = '';
  let pendingDeleteType     = null;         // 'task' | 'note'
  let pendingDeleteId       = null;

  let aiChatHistory         = [];
  let isAiResponding        = false;

  // Flowbite Modal instances
  let flowbiteModals = {};

  /* ==========================================================================
     DOM REFERENCES
     ========================================================================== */
  const qs  = (s, p) => (p || document).querySelector(s);
  const qsa = (s, p) => (p || document).querySelectorAll(s);

  // Lock Screen
  const lockScreen          = qs('#lock-screen');
  const pinDotsEl           = qs('#pin-dots');
  const pinErrorEl          = qs('#pin-error');
  const appShell            = qs('#app');
  const pageTitleEl         = qs('#page-title');
  const currentDateEl       = qs('#current-date');
  const settingsBtn         = qs('#settings-btn');

  // Views & Bottom Nav
  const viewTasks           = qs('#view-tasks');
  const viewNotes           = qs('#view-notes');
  const viewAi              = qs('#view-ai');
  const bottomNavItems      = qsa('.nav-item');

  // Filter Strips (Tasks)
  const categoryFilters     = qsa('#category-filters .filter-pill');
  const activePriorityPills = qs('#active-priority-pills');
  const priorityBtns        = qsa('#active-priority-pills .sub-pill');
  const finishedSubPills    = qs('#finished-sub-pills');
  const finishedSubBtns     = qsa('#finished-sub-pills .sub-pill');
  const finishedCountEl     = qs('#finished-count');

  // Task List & Empty
  const taskListEl          = qs('#task-list');
  const taskEmptyBox        = qs('#task-empty-state');
  const taskEmptyIcon       = qs('#task-empty-icon');
  const taskEmptyTitle      = qs('#task-empty-title');
  const taskEmptySub        = qs('#task-empty-sub');
  const taskFab             = qs('#task-fab');

  // Notes Elements
  const notesListEl         = qs('#notes-list');
  const notesSearchInput    = qs('#notes-search-input');
  const notesSearchClear    = qs('#notes-search-clear');
  const notesCategoryFilters= qsa('#notes-category-filters .notes-filter-pill');
  const notesEmptyBox       = qs('#notes-empty-state');
  const notesEmptyTitle     = qs('#notes-empty-title');
  const notesEmptySub       = qs('#notes-empty-sub');
  const notesFab            = qs('#notes-fab');

  // Add Task Modal
  const addTaskModalEl      = qs('#add-task-modal');
  const addCatChoices       = qsa('.cat-choice', qs('#add-cat-selector'));
  const addPriorityBtns     = qsa('#add-priority-group .priority-btn');
  const addTaskTitle        = qs('#add-task-title');
  const addTaskDesc         = qs('#add-task-desc');
  const addTaskReminder     = qs('#add-task-reminder');
  const addTaskSaveBtn      = qs('#add-task-save-btn');

  // Task Details Modal
  const detailTaskModalEl   = qs('#detail-task-modal');
  const taskDetailHead      = qs('#task-detail-title');
  const taskDetailSub       = qs('#task-detail-subtitle');
  const taskDetailBody      = qs('#task-detail-body');
  const taskDetailFooter    = qs('#task-detail-footer');

  // Note Modals
  const noteModalEl         = qs('#note-modal');
  const noteModalTitle      = qs('#note-modal-heading');
  const noteTitleInput      = qs('#note-title-input');
  const noteContentInput    = qs('#note-content-input');
  const noteCatChoices      = qsa('.note-cat-pill', qs('#note-cat-selector'));
  const noteSaveBtn         = qs('#note-save-btn');

  const noteDetailModalEl   = qs('#note-detail-modal');
  const noteDetailSub       = qs('#note-detail-sub');
  const noteDetailBody      = qs('#note-detail-body');
  const noteDetailFooter    = qs('#note-detail-footer');

  // Confirm Modal
  const confirmModalEl      = qs('#confirm-modal');
  const confirmTitle        = qs('#confirm-title');
  const confirmDelBtn       = qs('#confirm-del-btn');

  // Settings & Backup Modal
  const settingsModalEl     = qs('#settings-modal');
  const backupExportBtn     = qs('#backup-export-btn');
  const backupImportInput   = qs('#backup-import-input');

  // AI Elements
  const aiSettingsBtn       = qs('#ai-settings-btn');
  const aiActiveModelBadge  = qs('#ai-active-model-badge');
  const aiConfigModalEl     = qs('#ai-config-modal');
  const aiApiKeyInput       = qs('#ai-api-key-input');
  const aiApiToggleVis      = qs('#ai-api-toggle-vis');
  const aiModelSelect       = qs('#ai-model-select');
  const aiFetchModelsBtn    = qs('#ai-fetch-models-btn');
  const aiModelsFetchInfo   = qs('#ai-models-fetch-info');
  const aiBaseUrlInput      = qs('#ai-base-url-input');
  const aiTestBtn           = qs('#ai-test-btn');
  const aiTestStatus        = qs('#ai-test-status');
  const aiConfigSaveBtn     = qs('#ai-config-save-btn');
  const aiChatArea          = qs('#ai-chat-area');
  const aiChatInput         = qs('#ai-chat-input');
  const aiSendBtn           = qs('#ai-send-btn');
  const aiSummarizeBtn      = qs('#ai-summarize-btn');
  const aiClearBtn          = qs('#ai-clear-btn');

  /* ==========================================================================
     FLOWBITE TOAST UTILITY (RTL)
     ========================================================================== */
  function showToast(message, type = 'info') {
    const container = qs('#toast-container');
    if (!container) return;

    const toastId = 'toast-' + uid();
    const isError = type === 'error';

    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = 'flex items-center w-full max-w-xs p-3.5 space-x-3 rtl:space-x-reverse text-charcoal bg-white rounded-2xl shadow-xl border border-borderwarm transition-all duration-300 transform translate-y-[-10px] opacity-0 pointer-events-auto';

    let iconSvg = '';
    if (isError) {
      iconSvg = `
        <div class="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-primary-600 bg-primary-100 rounded-xl">
          <svg class="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
          </svg>
        </div>`;
    } else {
      iconSvg = `
        <div class="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-primary-600 bg-primary-100 rounded-xl">
          <svg class="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 12">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5.917 5.724 10.5 15 1.5"/>
          </svg>
        </div>`;
    }

    toast.innerHTML = `
      ${iconSvg}
      <div class="ms-3 text-xs font-semibold text-charcoal flex-1">${esc(message)}</div>
      <button type="button" class="ms-auto -mx-1.5 -my-1.5 text-muted hover:text-charcoal rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8" aria-label="${FA.close}">
        <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
        </svg>
      </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('translate-y-[-10px]', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    }, 10);

    const closeBtn = toast.querySelector('button');
    const dismiss = () => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-[-10px]', 'opacity-0');
      setTimeout(() => toast.remove(), 250);
    };

    closeBtn.addEventListener('click', dismiss);
    setTimeout(dismiss, 3200);
  }

  /* ==========================================================================
     FLOWBITE MODAL CONTROLLER
     ========================================================================== */
  function initFlowbiteModals() {
    const modalOptions = {
      backdrop: 'static',
      backdropClasses: 'bg-charcoal/50 fixed inset-0 z-40 backdrop-blur-sm',
      closable: true
    };

    if (typeof Flowbite !== 'undefined' && Flowbite.Modal) {
      flowbiteModals.addTask    = new Flowbite.Modal(addTaskModalEl, modalOptions);
      flowbiteModals.taskDetail = new Flowbite.Modal(detailTaskModalEl, modalOptions);
      flowbiteModals.noteModal  = new Flowbite.Modal(noteModalEl, modalOptions);
      flowbiteModals.noteDetail = new Flowbite.Modal(noteDetailModalEl, modalOptions);
      flowbiteModals.confirm    = new Flowbite.Modal(confirmModalEl, modalOptions);
      flowbiteModals.settings   = new Flowbite.Modal(settingsModalEl, modalOptions);
      flowbiteModals.aiConfig   = new Flowbite.Modal(aiConfigModalEl, modalOptions);
    } else {
      const createFallbackModal = (el) => ({
        show: () => {
          el.classList.remove('hidden');
          el.classList.add('flex');
        },
        hide: () => {
          el.classList.remove('flex');
          el.classList.add('hidden');
        }
      });

      flowbiteModals.addTask    = createFallbackModal(addTaskModalEl);
      flowbiteModals.taskDetail = createFallbackModal(detailTaskModalEl);
      flowbiteModals.noteModal  = createFallbackModal(noteModalEl);
      flowbiteModals.noteDetail = createFallbackModal(noteDetailModalEl);
      flowbiteModals.confirm    = createFallbackModal(confirmModalEl);
      flowbiteModals.settings   = createFallbackModal(settingsModalEl);
      flowbiteModals.aiConfig   = createFallbackModal(aiConfigModalEl);
    }

    qsa('[data-modal-hide]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-modal-hide');
        const targetEl = qs('#' + targetId);
        if (targetEl) {
          targetEl.classList.remove('flex');
          targetEl.classList.add('hidden');
        }
      });
    });
  }

  function openFlowbiteModal(key) {
    if (flowbiteModals[key] && typeof flowbiteModals[key].show === 'function') {
      flowbiteModals[key].show();
    }
  }

  function closeFlowbiteModal(key) {
    if (flowbiteModals[key] && typeof flowbiteModals[key].hide === 'function') {
      flowbiteModals[key].hide();
    }
  }

  /* ==========================================================================
     HELPERS & UTILS
     ========================================================================== */
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function esc(str) {
    if (!str) return '';
    const span = document.createElement('span');
    span.textContent = str;
    return span.innerHTML;
  }

  function updateHeaderDate() {
    if (!currentDateEl) return;
    currentDateEl.textContent = formatFaCurrentDay();
  }

  function renderCategoryBadge(cat) {
    const label = FA.categoryShort[cat] || FA.categories[cat] || cat;

    if (cat === 'Armin Department') {
      return `
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-charcoal text-white flex-shrink-0">
          <span class="w-3.5 h-3.5 rounded bg-charcoal p-0.5 flex items-center justify-center">
            <img src="assets/armin.png" alt="${label}" class="w-full h-full object-contain" />
          </span>
          <span>${label}</span>
        </span>`;
    }
    if (cat === 'Gold Sassan') {
      return `
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-white border border-gold/50 text-[#8C6B08] flex-shrink-0">
          <span class="w-3.5 h-3.5 rounded bg-white p-0.5 flex items-center justify-center">
            <img src="assets/sasan.webp" alt="${label}" class="w-full h-full object-contain" />
          </span>
          <span>${label}</span>
        </span>`;
    }
    if (cat === 'KhoshKam') {
      return `
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-white border border-borderwarm text-[#1A5FA8] flex-shrink-0">
          <span class="w-3.5 h-3.5 rounded bg-white p-0.5 flex items-center justify-center">
            <img src="assets/favicon.png" alt="${label}" class="w-full h-full object-contain" />
          </span>
          <span>${label}</span>
        </span>`;
    }
    if (cat === 'Latifi Store') {
      return `
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-white border border-orange-300 text-[#C05621] flex-shrink-0">
          <span class="w-3.5 h-3.5 rounded bg-white p-0.5 flex items-center justify-center">
            <img src="assets/latifi.png" alt="${label}" class="w-full h-full object-contain" />
          </span>
          <span>${label}</span>
        </span>`;
    }
    return '';
  }

  function renderPriorityBadge(priority) {
    if (priority === 'urgent') {
      return `
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-primary-100 text-primary-700 border border-primary-200 flex-shrink-0">
          <svg class="w-3 h-3 text-primary-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7 7.674 13.074a1 1 0 0 0 .756 1.66h3.693l-.845 4.542a1 1 0 0 0 1.745.748L18.35 14.07a1 1 0 0 0-.756-1.66h-3.693L14.746 7.87A1 1 0 0 0 13 7Z"/>
          </svg>
          <span>${FA.priorities.urgent}</span>
        </span>`;
    }
    return `
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-gray-100 text-muted flex-shrink-0">
        <span>${FA.priorities.normal}</span>
      </span>`;
  }

  /* ==========================================================================
     STORAGE OPERATIONS
     ========================================================================== */
  function getTasks() {
    try {
      const raw = localStorage.getItem(SK_TASKS);
      const list = raw ? JSON.parse(raw) : [];
      return list.map(t => {
        if (!t.priority) t.priority = 'normal';
        if (t.done && !t.completedAt) {
          t.completedAt = t.updatedAt || t.createdAt || new Date().toISOString();
        }
        return t;
      });
    } catch {
      return [];
    }
  }

  function saveTasks(tasks) {
    localStorage.setItem(SK_TASKS, JSON.stringify(tasks));
    updateFinishedCount();
  }

  function getTask(id) {
    return getTasks().find(t => t.id === id);
  }

  function getNotes() {
    try {
      const raw = localStorage.getItem(SK_NOTES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveNotes(notes) {
    localStorage.setItem(SK_NOTES, JSON.stringify(notes));
  }

  function getNote(id) {
    return getNotes().find(n => n.id === id);
  }

  function updateFinishedCount() {
    const finished = getTasks().filter(t => t.done).length;
    if (finishedCountEl) {
      finishedCountEl.textContent = toFaDigits(finished);
    }
  }

  /* ==========================================================================
     REMINDER & PUSH NOTIFICATION SYSTEM
     ========================================================================== */
  function requestNotificationPermission() {
    if (!('Notification' in window)) return Promise.resolve(false);
    if (Notification.permission === 'granted') return Promise.resolve(true);
    if (Notification.permission !== 'denied') {
      return Notification.requestPermission().then(permission => permission === 'granted');
    }
    return Promise.resolve(false);
  }

  function triggerNotification(task) {
    const title = task.title;
    const body = task.description ? task.description.slice(0, 80) : FA.reminderFired;

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
          navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(title, {
              body: body,
              icon: 'icons/icon-192x192.png',
              badge: 'icons/icon-192x192.png',
              tag: 'todo-reminder-' + task.id,
              renotify: true,
              lang: 'fa',
              dir: 'rtl'
            });
          }).catch(() => {
            new Notification(title, { body: body, icon: 'icons/icon-192x192.png', dir: 'rtl', lang: 'fa' });
          });
        } else {
          new Notification(title, { body: body, icon: 'icons/icon-192x192.png', dir: 'rtl', lang: 'fa' });
        }
      } catch (e) {
        console.warn('Notification trigger failed:', e);
      }
    }

    showToast(`⏰ یادآوری: ${title}`, 'info');
  }

  function checkReminders() {
    const tasks = getTasks();
    const now = new Date();
    let changed = false;

    tasks.forEach(t => {
      if (!t.done && t.reminderAt && !t.reminded) {
        const reminderTime = new Date(t.reminderAt);
        if (!isNaN(reminderTime.getTime()) && reminderTime <= now) {
          t.reminded = true;
          changed = true;
          triggerNotification(t);
        }
      }
    });

    if (changed) {
      saveTasks(tasks);
      renderTasks();
    }
  }

  /* ==========================================================================
     PIN LOCK SYSTEM (KEYPAD & 24H MEMORY)
     ========================================================================== */
  function isPinValid() {
    const ts = localStorage.getItem(SK_PIN_TS);
    return ts && (Date.now() - Number(ts)) < PIN_EXPIRY;
  }

  function unlockApp() {
    localStorage.setItem(SK_PIN_TS, String(Date.now()));
    lockScreen.classList.add('opacity-0', 'scale-105', 'pointer-events-none');
    appShell.classList.remove('hidden');
    renderCurrentView();
    showToast(FA.unlockedToast, 'success');
    setTimeout(() => { lockScreen.style.display = 'none'; }, 350);
  }

  function handlePinKey(key) {
    if (key === 'delete') {
      pinInput = pinInput.slice(0, -1);
      updateDots();
      pinErrorEl.textContent = '';
      return;
    }

    if (pinInput.length >= 4) return;
    pinInput += key;
    updateDots();

    if (pinInput.length === 4) {
      setTimeout(() => {
        if (pinInput === CORRECT_PIN) {
          unlockApp();
        } else {
          pinErrorEl.textContent = FA.wrongPin;
          pinDotsEl.classList.add('animate-shake');
          showToast(FA.toastWrongPin, 'error');
          setTimeout(() => pinDotsEl.classList.remove('animate-shake'), 400);
          pinInput = '';
          updateDots();
        }
      }, 150);
    }
  }

  function updateDots() {
    const dots = qsa('span', pinDotsEl);
    dots.forEach((d, i) => {
      if (i < pinInput.length) {
        d.classList.add('bg-primary-600', 'border-primary-600', 'scale-110');
      } else {
        d.classList.remove('bg-primary-600', 'border-primary-600', 'scale-110');
      }
    });
  }

  /* ==========================================================================
     TAB SWITCHING (Tasks vs Notes vs AI)
     ========================================================================== */
  function switchTab(tab) {
    activeTab = tab;
    bottomNavItems.forEach(b => {
      const isCurrent = b.dataset.tab === tab;
      b.classList.toggle('text-primary-600', isCurrent);
      b.classList.toggle('text-muted', !isCurrent);
    });

    if (tab === 'tasks') {
      pageTitleEl.textContent = FA.tasks;
      viewTasks.classList.remove('hidden');
      viewNotes.classList.add('hidden');
      viewAi.classList.add('hidden');
      renderTasks();
    } else if (tab === 'notes') {
      pageTitleEl.textContent = FA.notes;
      viewNotes.classList.remove('hidden');
      viewTasks.classList.add('hidden');
      viewAi.classList.add('hidden');
      renderNotes();
    } else {
      pageTitleEl.textContent = FA.ai;
      viewAi.classList.remove('hidden');
      viewTasks.classList.add('hidden');
      viewNotes.classList.add('hidden');
      initAiSection();
    }
  }

  function renderCurrentView() {
    updateHeaderDate();
    updateFinishedCount();
    if (activeTab === 'tasks') {
      renderTasks();
    } else if (activeTab === 'notes') {
      renderNotes();
    } else {
      initAiSection();
    }
  }

  /* ==========================================================================
     RENDER TASKS (RTL MIRRORED)
     ========================================================================== */
  function renderTasks() {
    const all = getTasks();
    const isFinishedView = activeCategory === 'finished';

    if (isFinishedView) {
      activePriorityPills.classList.add('hidden');
      finishedSubPills.classList.remove('hidden');
    } else {
      activePriorityPills.classList.remove('hidden');
      finishedSubPills.classList.add('hidden');
    }

    let list = [];

    if (isFinishedView) {
      list = all.filter(t => t.done);
      if (activeFinishedCat !== 'all') {
        list = list.filter(t => t.category === activeFinishedCat);
      }
      list.sort((a, b) => new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt));
    } else {
      list = all.filter(t => !t.done);

      if (activeCategory !== 'all') {
        list = list.filter(t => t.category === activeCategory);
      }

      if (activePriority !== 'all') {
        list = list.filter(t => (t.priority || 'normal') === activePriority);
      }

      // Urgent tasks first, then Normal, newest first
      list.sort((a, b) => {
        const pA = (a.priority === 'urgent') ? 1 : 0;
        const pB = (b.priority === 'urgent') ? 1 : 0;
        if (pA !== pB) return pB - pA;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    }

    if (list.length === 0) {
      taskListEl.innerHTML = '';
      taskEmptyBox.classList.remove('hidden');

      if (isFinishedView) {
        taskEmptyIcon.innerHTML = `
          <svg class="w-7 h-7" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 11.917 9.724 16.5 19 7.5"/>
          </svg>`;
        taskEmptyTitle.textContent = FA.emptyTasksFinished;
        taskEmptySub.textContent = FA.emptyTasksFinishedSub;
      } else if (activePriority !== 'all' || activeCategory !== 'all') {
        taskEmptyIcon.innerHTML = `
          <svg class="w-7 h-7" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
          </svg>`;
        taskEmptyTitle.textContent = FA.emptyTasksFilter;
        taskEmptySub.textContent = FA.emptyTasksFilterSub;
      } else {
        taskEmptyIcon.innerHTML = `
          <svg class="w-7 h-7" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-3 5h3m-6 0h.01M12 16h3m-6 0h.01M10 3v4h4V3h-4Z"/>
          </svg>`;
        taskEmptyTitle.textContent = FA.emptyTasksAll;
        taskEmptySub.textContent = FA.emptyTasksAllSub;
      }
      return;
    }

    taskEmptyBox.classList.add('hidden');

    taskListEl.innerHTML = list.map((t) => {
      const isDone = Boolean(t.done);
      const hasReminder = Boolean(t.reminderAt);
      const reminderDate = hasReminder ? new Date(t.reminderAt) : null;
      const isOverdue = reminderDate && reminderDate < new Date() && !isDone;

      return `
        <div class="task-card flex items-center gap-3 p-3.5 mb-3 bg-white border border-borderwarm rounded-2xl shadow-soft hover:shadow-md transition-all cursor-pointer ${isDone ? 'opacity-70 bg-gray-50' : ''}" data-id="${t.id}">
          <!-- Check Touch Target (Start / Right side in RTL) -->
          <button type="button" class="check-btn flex items-center justify-center w-11 h-11 -ms-1 bg-transparent border-0 cursor-pointer flex-shrink-0" data-check="${t.id}" aria-label="${isDone ? FA.undo : FA.statusCompleted}">
            <span class="round-check w-6 h-6 rounded-full border-2 border-borderwarm flex items-center justify-center transition-all ${isDone ? 'bg-primary-600 border-primary-600' : 'hover:border-primary-600'}">
              <svg class="w-3.5 h-3.5 text-white ${isDone ? 'block' : 'hidden'}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </span>
          </button>
          <!-- Task Card Body -->
          <div class="flex-1 min-w-0 text-start">
            <h4 class="text-sm font-semibold text-charcoal truncate mb-1 ${isDone ? 'line-through text-muted' : ''}" dir="auto">${esc(t.title)}</h4>
            <div class="flex items-center gap-2 overflow-hidden flex-nowrap">
              ${renderCategoryBadge(t.category)}
              ${renderPriorityBadge(t.priority || 'normal')}
              ${hasReminder && !isDone ? `
                <span class="inline-flex items-center gap-1 text-[11px] ${isOverdue ? 'text-primary-600 font-semibold' : 'text-muted'} truncate flex-shrink-0">
                  <svg class="w-3 h-3 flex-shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                  </svg>
                  <span>${formatFaDate(t.reminderAt)}</span>
                </span>` : ''}
              ${isDone && t.completedAt ? `<span class="text-[11px] text-muted truncate">${FA.doneOn} ${formatFaDate(t.completedAt)}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /* ==========================================================================
     TASK OPERATIONS
     ========================================================================== */
  function createTask(title, desc, category, priority, reminderAt) {
    const tasks = getTasks();
    const now = new Date().toISOString();
    const newTask = {
      id: uid(),
      title: title.trim(),
      description: (desc || '').trim(),
      category: category,
      priority: priority || 'normal',
      reminderAt: reminderAt || null,
      reminded: false,
      done: false,
      createdAt: now,
      updatedAt: now,
      completedAt: null
    };
    tasks.unshift(newTask);
    saveTasks(tasks);
    renderTasks();
    showToast(FA.toastTaskSaved, 'success');

    if (reminderAt) {
      requestNotificationPermission();
    }
    return newTask;
  }

  function completeTask(id, cardEl, roundBox) {
    roundBox.classList.add('animate-check-pop', 'bg-primary-600', 'border-primary-600');
    const checkSvg = roundBox.querySelector('svg');
    if (checkSvg) checkSvg.classList.remove('hidden');

    setTimeout(() => {
      cardEl.classList.add('transition-all', 'duration-300', '-translate-x-8', 'opacity-0');
      setTimeout(() => {
        const tasks = getTasks();
        const t = tasks.find(x => x.id === id);
        if (t) {
          t.done = true;
          t.completedAt = new Date().toISOString();
          t.updatedAt = new Date().toISOString();
          saveTasks(tasks);
          renderTasks();
          showToast(FA.toastTaskMovedFinished, 'success');
        }
      }, 260);
    }, 180);
  }

  function uncompleteTask(id) {
    const tasks = getTasks();
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    t.done = false;
    t.completedAt = null;
    t.updatedAt = new Date().toISOString();
    saveTasks(tasks);
    renderTasks();
    showToast(FA.toastTaskRestored, 'info');
  }

  function updateTask(id, updates) {
    const tasks = getTasks();
    const t = tasks.find(x => x.id === id);
    if (!t) return;

    if (updates.reminderAt && updates.reminderAt !== t.reminderAt) {
      updates.reminded = false;
      requestNotificationPermission();
    }

    Object.assign(t, updates, { updatedAt: new Date().toISOString() });
    saveTasks(tasks);
    renderTasks();
    showToast(FA.toastTaskUpdated, 'success');
  }

  function deleteTask(id) {
    const filtered = getTasks().filter(x => x.id !== id);
    saveTasks(filtered);
    renderTasks();
    showToast(FA.toastTaskDeleted, 'info');
  }

  /* ==========================================================================
     ADD TASK MODAL
     ========================================================================== */
  function openAddTaskModal() {
    selectedAddCategory = '';
    selectedAddPriority = 'normal';
    addTaskTitle.value = '';
    addTaskDesc.value = '';
    if (addTaskReminder) addTaskReminder.value = '';
    addTaskTitle.classList.remove('border-primary-600', 'ring-2', 'ring-primary-200');

    addCatChoices.forEach(c => {
      c.classList.remove('border-primary-600', 'bg-primary-50/30');
      const check = c.querySelector('.choice-check');
      if (check) check.classList.add('hidden');
    });

    addPriorityBtns.forEach(b => {
      const isNorm = b.dataset.priority === 'normal';
      b.classList.toggle('text-primary-600', isNorm);
      b.classList.toggle('bg-primary-50', isNorm);
      b.classList.toggle('border-primary-200', isNorm);
      b.classList.toggle('active', isNorm);
      b.classList.toggle('bg-white', !isNorm);
    });

    openFlowbiteModal('addTask');
    setTimeout(() => addTaskTitle.focus(), 250);
  }

  function handleSaveNewTask() {
    let valid = true;
    const title = addTaskTitle.value.trim();

    if (!selectedAddCategory) {
      addCatChoices.forEach(c => c.classList.add('border-primary-600'));
      showToast(FA.valCategoryRequired, 'error');
      valid = false;
    }
    if (!title) {
      addTaskTitle.classList.add('border-primary-600', 'ring-2', 'ring-primary-200');
      if (valid) showToast(FA.valTitleRequired, 'error');
      addTaskTitle.focus();
      valid = false;
    }
    if (!valid) return;

    const reminderValue = addTaskReminder ? addTaskReminder.value : '';

    createTask(title, addTaskDesc.value, selectedAddCategory, selectedAddPriority, reminderValue);
    closeFlowbiteModal('addTask');
  }

  /* ==========================================================================
     TASK DETAILS MODAL & EDIT MODE
     ========================================================================== */
  function openTaskDetailModal(id) {
    const task = getTask(id);
    if (!task) return;
    openTaskId = id;
    taskDetailHead.textContent = FA.taskDetails;
    taskDetailSub.textContent = task.done ? FA.finished : FA.statusInProgress;
    renderTaskDetailView(task);
    openFlowbiteModal('taskDetail');
  }

  function renderTaskDetailView(task) {
    const isDone = Boolean(task.done);

    taskDetailBody.innerHTML = `
      <div>
        <span class="block mb-1.5 text-xs font-semibold text-muted">${FA.categoryLabel} و ${FA.priorityLabel}</span>
        <div class="flex items-center gap-2">
          ${renderCategoryBadge(task.category)}
          ${renderPriorityBadge(task.priority || 'normal')}
        </div>
      </div>

      <div>
        <span class="block mb-1 text-xs font-semibold text-muted">${FA.titleLabel}</span>
        <h4 class="text-base font-bold text-charcoal" dir="auto">${esc(task.title)}</h4>
      </div>

      <div>
        <span class="block mb-1 text-xs font-semibold text-muted">${FA.descLabel}</span>
        <div class="text-sm text-charcoal bg-ivory p-3 rounded-xl border border-borderwarm whitespace-pre-wrap leading-relaxed" dir="auto">
          ${task.description ? esc(task.description) : `<span class="text-muted italic">${FA.noDescProvided}</span>`}
        </div>
      </div>

      ${task.reminderAt ? `
      <div>
        <span class="block mb-1 text-xs font-semibold text-muted">${FA.reminderLabel}</span>
        <div class="p-2.5 rounded-xl bg-primary-50 border border-primary-100 flex items-center gap-2 text-xs text-primary-700 font-medium">
          <svg class="w-4 h-4 text-primary-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
          </svg>
          <span>${formatFaDate(task.reminderAt)}</span>
        </div>
      </div>` : ''}

      <div class="grid grid-cols-2 gap-3 text-xs">
        <div class="p-2.5 rounded-xl bg-ivory border border-borderwarm">
          <span class="block font-semibold text-muted mb-0.5">${FA.createdDate}</span>
          <span class="text-charcoal font-medium">${formatFaDate(task.createdAt)}</span>
        </div>
        ${task.completedAt ? `
        <div class="p-2.5 rounded-xl bg-primary-50 border border-primary-100">
          <span class="block font-semibold text-primary-700 mb-0.5">${FA.completedDate}</span>
          <span class="text-primary-700 font-bold">${formatFaDate(task.completedAt)}</span>
        </div>` : `
        <div class="p-2.5 rounded-xl bg-ivory border border-borderwarm">
          <span class="block font-semibold text-muted mb-0.5">${FA.status}</span>
          <span class="text-charcoal font-medium">${FA.statusInProgress}</span>
        </div>`}
      </div>
    `;

    if (isDone) {
      taskDetailFooter.innerHTML = `
        <button type="button" id="task-undo-btn" class="flex-1 py-3 px-4 text-xs font-semibold text-[#8C6B08] bg-[#FFFDF8] border border-gold rounded-xl hover:bg-gold/10 transition-all text-center flex items-center justify-center gap-1.5">
          <svg class="w-4 h-4 rtl:scale-x-[-1]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9h13a5 5 0 0 1 0 10H7M3 9l4-4M3 9l4 4"/>
          </svg>
          ${FA.undo}
        </button>
        <button type="button" id="task-edit-btn" class="flex-1 py-3 px-4 text-xs font-semibold text-primary-600 bg-primary-50 rounded-xl hover:bg-primary-100 transition-all text-center">${FA.edit}</button>
        <button type="button" id="task-del-btn" class="py-3 px-4 text-xs font-semibold text-muted bg-gray-100 rounded-xl hover:bg-gray-200 transition-all text-center">${FA.delete}</button>
      `;

      qs('#task-undo-btn').addEventListener('click', () => {
        uncompleteTask(task.id);
        closeFlowbiteModal('taskDetail');
      });
    } else {
      taskDetailFooter.innerHTML = `
        <button type="button" id="task-edit-btn" class="flex-1 py-3 px-4 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all text-center shadow-md">${FA.edit}</button>
        <button type="button" id="task-del-btn" class="py-3 px-4 text-xs font-semibold text-muted bg-gray-100 rounded-xl hover:bg-gray-200 transition-all text-center">${FA.delete}</button>
      `;
    }

    qs('#task-edit-btn').addEventListener('click', () => enterTaskEditMode(task));
    qs('#task-del-btn').addEventListener('click', () => {
      promptDelete('task', task.id, `آیا از حذف «${task.title}» مطمئن هستید؟`);
    });
  }

  function enterTaskEditMode(task) {
    taskDetailHead.textContent = FA.editTask;
    taskDetailSub.textContent = 'ویرایش دسته‌بندی، اولویت و متن کار';
    let editCategory = task.category;
    let editPriority = task.priority || 'normal';

    taskDetailBody.innerHTML = `
      <div>
        <label class="block mb-2 text-xs font-semibold text-muted">${FA.categoryLabel} <span class="text-primary-600">*</span></label>
        <div class="grid grid-cols-2 gap-2" id="edit-cat-selector">
          <div class="cat-choice flex flex-col items-center justify-center p-3 rounded-2xl border-2 ${task.category === 'Armin Department' ? 'border-primary-600 bg-primary-50/30' : 'border-borderwarm'} bg-white cursor-pointer relative text-center" data-cat="Armin Department" role="button">
            <div class="w-9 h-9 rounded-xl bg-charcoal p-1.5 flex items-center justify-center mb-1.5 flex-shrink-0">
              <img src="assets/armin.png" alt="املاک آرمین" class="w-full h-full object-contain" />
            </div>
            <span class="text-xs font-semibold text-charcoal truncate w-full">املاک آرمین</span>
            <span class="choice-check absolute top-1.5 end-1.5 w-4 h-4 rounded-full bg-primary-600 text-white ${task.category === 'Armin Department' ? 'flex' : 'hidden'} items-center justify-center">
              <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
          </div>

          <div class="cat-choice flex flex-col items-center justify-center p-3 rounded-2xl border-2 ${task.category === 'Latifi Store' ? 'border-primary-600 bg-primary-50/30' : 'border-borderwarm'} bg-white cursor-pointer relative text-center" data-cat="Latifi Store" role="button">
            <div class="w-9 h-9 rounded-xl bg-white border border-orange-300 p-1 flex items-center justify-center mb-1.5 flex-shrink-0">
              <img src="assets/latifi.png" alt="لطیفی" class="w-full h-full object-contain" />
            </div>
            <span class="text-xs font-semibold text-charcoal truncate w-full">لطیفی استور</span>
            <span class="choice-check absolute top-1.5 end-1.5 w-4 h-4 rounded-full bg-primary-600 text-white ${task.category === 'Latifi Store' ? 'flex' : 'hidden'} items-center justify-center">
              <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
          </div>

          <div class="cat-choice flex flex-col items-center justify-center p-3 rounded-2xl border-2 ${task.category === 'Gold Sassan' ? 'border-primary-600 bg-primary-50/30' : 'border-borderwarm'} bg-white cursor-pointer relative text-center" data-cat="Gold Sassan" role="button">
            <div class="w-9 h-9 rounded-xl bg-white border border-gold/50 p-1 flex items-center justify-center mb-1.5 flex-shrink-0">
              <img src="assets/sasan.webp" alt="ساسان" class="w-full h-full object-contain" />
            </div>
            <span class="text-xs font-semibold text-charcoal truncate w-full">طلا ساسان</span>
            <span class="choice-check absolute top-1.5 end-1.5 w-4 h-4 rounded-full bg-primary-600 text-white ${task.category === 'Gold Sassan' ? 'flex' : 'hidden'} items-center justify-center">
              <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
          </div>

          <div class="cat-choice flex flex-col items-center justify-center p-3 rounded-2xl border-2 ${task.category === 'KhoshKam' ? 'border-primary-600 bg-primary-50/30' : 'border-borderwarm'} bg-white cursor-pointer relative text-center" data-cat="KhoshKam" role="button">
            <div class="w-9 h-9 rounded-xl bg-white border border-borderwarm p-1 flex items-center justify-center mb-1.5 flex-shrink-0">
              <img src="assets/favicon.png" alt="خوشکام" class="w-full h-full object-contain" />
            </div>
            <span class="text-xs font-semibold text-charcoal truncate w-full">خوشکام</span>
            <span class="choice-check absolute top-1.5 end-1.5 w-4 h-4 rounded-full bg-primary-600 text-white ${task.category === 'KhoshKam' ? 'flex' : 'hidden'} items-center justify-center">
              <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
          </div>
        </div>
      </div>

      <div>
        <label class="block mb-2 text-xs font-semibold text-muted">${FA.priorityLabel}</label>
        <div class="inline-flex rounded-xl shadow-sm w-full" role="group" id="edit-priority-group">
          <button type="button" class="edit-p-btn flex-1 py-2.5 px-4 text-xs font-medium ${editPriority === 'normal' ? 'text-primary-600 bg-primary-50 border border-primary-200 active' : 'text-gray-900 bg-white border border-borderwarm'} rounded-s-xl" data-val="normal">
            ${FA.priorities.normal}
          </button>
          <button type="button" class="edit-p-btn flex-1 py-2.5 px-4 text-xs font-medium ${editPriority === 'urgent' ? 'text-primary-600 bg-primary-50 border border-primary-200 active' : 'text-gray-900 bg-white border border-borderwarm'} rounded-e-xl flex items-center justify-center gap-1.5" data-val="urgent">
            <svg class="w-3.5 h-3.5 text-primary-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7 7.674 13.074a1 1 0 0 0 .756 1.66h3.693l-.845 4.542a1 1 0 0 0 1.745.748L18.35 14.07a1 1 0 0 0-.756-1.66h-3.693L14.746 7.87A1 1 0 0 0 13 7Z"/>
            </svg>
            ${FA.priorities.urgent}
          </button>
        </div>
      </div>

      <div>
        <label for="edit-task-title" class="block mb-2 text-xs font-semibold text-muted">${FA.titleLabel} <span class="text-primary-600">*</span></label>
        <input type="text" id="edit-task-title" class="bg-white border border-borderwarm text-charcoal text-sm rounded-xl focus:ring-primary-600 focus:border-primary-600 block w-full p-3 outline-none" value="${esc(task.title)}" maxlength="200" dir="auto">
      </div>

      <div>
        <label for="edit-task-desc" class="block mb-2 text-xs font-semibold text-muted">${FA.descLabel}</label>
        <textarea id="edit-task-desc" rows="3" class="block p-3 w-full text-sm text-charcoal bg-white rounded-xl border border-borderwarm focus:ring-primary-600 focus:border-primary-600 outline-none" maxlength="2000" dir="auto">${esc(task.description)}</textarea>
      </div>

      <div>
        <label for="edit-task-reminder" class="block mb-2 text-xs font-semibold text-muted">${FA.reminderLabel}</label>
        <input type="datetime-local" id="edit-task-reminder" class="bg-white border border-borderwarm text-charcoal text-sm rounded-xl focus:ring-primary-600 focus:border-primary-600 block w-full p-3 outline-none" value="${task.reminderAt || ''}" dir="ltr">
      </div>
    `;

    const editCatCards = qsa('.cat-choice', qs('#edit-cat-selector'));
    editCatCards.forEach(c => {
      c.addEventListener('click', () => {
        editCatCards.forEach(x => {
          x.classList.remove('border-primary-600', 'bg-primary-50/30');
          x.querySelector('.choice-check').classList.add('hidden');
        });
        c.classList.add('border-primary-600', 'bg-primary-50/30');
        c.querySelector('.choice-check').classList.remove('hidden');
        editCategory = c.dataset.cat;
      });
    });

    const editPBtns = qsa('.edit-p-btn', qs('#edit-priority-group'));
    editPBtns.forEach(b => {
      b.addEventListener('click', () => {
        editPBtns.forEach(x => {
          x.classList.remove('text-primary-600', 'bg-primary-50', 'border-primary-200');
          x.classList.add('text-gray-900', 'bg-white', 'border-borderwarm');
        });
        b.classList.add('text-primary-600', 'bg-primary-50', 'border-primary-200');
        b.classList.remove('bg-white');
        editPriority = b.dataset.val;
      });
    });

    taskDetailFooter.innerHTML = `
      <button type="button" id="edit-task-cancel" class="w-1/2 py-3 px-4 text-xs font-semibold text-charcoal bg-gray-100 rounded-xl hover:bg-gray-200 transition-all text-center">${FA.cancel}</button>
      <button type="button" id="edit-task-save" class="w-1/2 py-3 px-4 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all text-center shadow-md">${FA.saveChanges}</button>
    `;

    qs('#edit-task-cancel').addEventListener('click', () => {
      const fresh = getTask(openTaskId);
      if (fresh) {
        taskDetailHead.textContent = FA.taskDetails;
        renderTaskDetailView(fresh);
      }
    });

    qs('#edit-task-save').addEventListener('click', () => {
      const t = qs('#edit-task-title').value.trim();
      if (!t) {
        qs('#edit-task-title').classList.add('border-primary-600', 'ring-2', 'ring-primary-200');
        showToast(FA.valTitleRequired, 'error');
        qs('#edit-task-title').focus();
        return;
      }
      const reminderVal = qs('#edit-task-reminder').value;
      updateTask(openTaskId, {
        title: t,
        description: qs('#edit-task-desc').value.trim(),
        category: editCategory,
        priority: editPriority,
        reminderAt: reminderVal || null
      });
      const fresh = getTask(openTaskId);
      if (fresh) {
        taskDetailHead.textContent = FA.taskDetails;
        renderTaskDetailView(fresh);
      }
    });
  }

  /* ==========================================================================
     NOTES SECTION (WITH CATEGORIES)
     ========================================================================== */
  function renderNotes() {
    const all = getNotes();
    let list = all.slice();

    // Category Filter for Notes
    if (activeNoteCategory === 'none') {
      list = list.filter(n => !n.category);
    } else if (activeNoteCategory !== 'all') {
      list = list.filter(n => n.category === activeNoteCategory);
    }

    list.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

    if (notesSearchQuery.trim()) {
      const q = notesSearchQuery.toLowerCase().trim();
      list = list.filter(n => (n.title && n.title.toLowerCase().includes(q)) || (n.content && n.content.toLowerCase().includes(q)));
    }

    if (list.length === 0) {
      notesListEl.innerHTML = '';
      notesEmptyBox.classList.remove('hidden');

      if (notesSearchQuery.trim()) {
        notesEmptyTitle.textContent = FA.emptyNotesSearch;
        notesEmptySub.textContent = `هیچ یادداشتی با عبارت «${notesSearchQuery}» پیدا نشد`;
      } else {
        notesEmptyTitle.textContent = FA.emptyNotes;
        notesEmptySub.textContent = FA.emptyNotesSub;
      }
      return;
    }

    notesEmptyBox.classList.add('hidden');

    notesListEl.innerHTML = list.map((n) => `
      <div class="note-card p-4 mb-3 bg-white border border-borderwarm rounded-2xl shadow-soft hover:shadow-md transition-all cursor-pointer text-start" data-id="${n.id}">
        <div class="flex items-start justify-between gap-2 mb-1.5">
          <h4 class="text-sm font-bold text-charcoal truncate flex-1" dir="auto">${esc(n.title)}</h4>
          ${n.category ? renderCategoryBadge(n.category) : ''}
        </div>
        <p class="text-xs text-muted line-clamp-2 mb-2 leading-relaxed" dir="auto">${esc(n.content || '')}</p>
        <span class="text-[11px] text-muted block">${formatFaDate(n.updatedAt || n.createdAt)}</span>
      </div>
    `).join('');
  }

  function openAddNoteModal() {
    openNoteId = null;
    selectedNoteCategory = '';
    noteModalTitle.textContent = FA.newNote;
    noteTitleInput.value = '';
    noteContentInput.value = '';
    noteTitleInput.classList.remove('border-primary-600', 'ring-2', 'ring-primary-200');
    noteContentInput.classList.remove('border-primary-600', 'ring-2', 'ring-primary-200');

    noteCatChoices.forEach(c => {
      const isNone = c.dataset.notecat === '';
      c.classList.toggle('bg-primary-600', isNone);
      c.classList.toggle('text-white', isNone);
      c.classList.toggle('border-primary-600', isNone);
      c.classList.toggle('bg-ivory', !isNone);
      c.classList.toggle('text-muted', !isNone);
    });

    openFlowbiteModal('noteModal');
    setTimeout(() => noteTitleInput.focus(), 250);
  }

  function openEditNoteModal(note) {
    openNoteId = note.id;
    selectedNoteCategory = note.category || '';
    noteModalTitle.textContent = FA.editNote;
    noteTitleInput.value = note.title;
    noteContentInput.value = note.content;
    noteTitleInput.classList.remove('border-primary-600', 'ring-2', 'ring-primary-200');
    noteContentInput.classList.remove('border-primary-600', 'ring-2', 'ring-primary-200');

    noteCatChoices.forEach(c => {
      const match = c.dataset.notecat === (note.category || '');
      c.classList.toggle('bg-primary-600', match);
      c.classList.toggle('text-white', match);
      c.classList.toggle('border-primary-600', match);
      c.classList.toggle('bg-ivory', !match);
      c.classList.toggle('text-muted', !match);
    });

    openFlowbiteModal('noteModal');
    setTimeout(() => noteTitleInput.focus(), 250);
  }

  function handleSaveNote() {
    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();
    let valid = true;

    if (!title) {
      noteTitleInput.classList.add('border-primary-600', 'ring-2', 'ring-primary-200');
      showToast(FA.valTitleRequired, 'error');
      noteTitleInput.focus();
      valid = false;
    }
    if (!content) {
      noteContentInput.classList.add('border-primary-600', 'ring-2', 'ring-primary-200');
      if (valid) showToast(FA.valContentRequired, 'error');
      valid = false;
    }
    if (!valid) return;

    const notes = getNotes();
    const now = new Date().toISOString();

    if (openNoteId) {
      const n = notes.find(x => x.id === openNoteId);
      if (n) {
        n.title = title;
        n.content = content;
        n.category = selectedNoteCategory || null;
        n.updatedAt = now;
        saveNotes(notes);
      }
      closeFlowbiteModal('noteModal');
      const fresh = getNote(openNoteId);
      if (fresh) renderNoteDetailView(fresh);
      showToast(FA.toastNoteUpdated, 'success');
    } else {
      notes.unshift({
        id: uid(),
        title: title,
        content: content,
        category: selectedNoteCategory || null,
        createdAt: now,
        updatedAt: now
      });
      saveNotes(notes);
      closeFlowbiteModal('noteModal');
      showToast(FA.toastNoteSaved, 'success');
    }

    renderNotes();
  }

  function openNoteDetailModal(id) {
    const note = getNote(id);
    if (!note) return;
    openNoteId = id;
    renderNoteDetailView(note);
    openFlowbiteModal('noteDetail');
  }

  function renderNoteDetailView(note) {
    noteDetailSub.textContent = `${FA.lastEditedNote} ${formatFaDate(note.updatedAt || note.createdAt)}`;

    noteDetailBody.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-semibold text-muted">${FA.titleLabel}</span>
        ${note.category ? renderCategoryBadge(note.category) : `<span class="text-xs text-muted font-medium">${FA.noCategoryNote}</span>`}
      </div>

      <div>
        <h4 class="text-lg font-bold text-charcoal" dir="auto">${esc(note.title)}</h4>
      </div>

      <div>
        <span class="block mb-1 text-xs font-semibold text-muted">متن یادداشت</span>
        <div class="text-sm text-charcoal bg-ivory p-3.5 rounded-xl border border-borderwarm whitespace-pre-wrap leading-relaxed" dir="auto">
          ${esc(note.content)}
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 text-xs">
        <div class="p-2.5 rounded-xl bg-ivory border border-borderwarm">
          <span class="block font-semibold text-muted mb-0.5">${FA.createdDateNote}</span>
          <span class="text-charcoal font-medium">${formatFaDate(note.createdAt)}</span>
        </div>
        <div class="p-2.5 rounded-xl bg-ivory border border-borderwarm">
          <span class="block font-semibold text-muted mb-0.5">${FA.lastEditedNote}</span>
          <span class="text-charcoal font-medium">${formatFaDate(note.updatedAt || note.createdAt)}</span>
        </div>
      </div>
    `;

    noteDetailFooter.innerHTML = `
      <button type="button" id="note-edit-btn" class="w-1/2 py-3 px-4 text-xs font-semibold text-primary-600 bg-primary-50 rounded-xl hover:bg-primary-100 transition-all text-center">${FA.edit}</button>
      <button type="button" id="note-del-btn" class="w-1/2 py-3 px-4 text-xs font-semibold text-muted bg-gray-100 rounded-xl hover:bg-gray-200 transition-all text-center">${FA.delete}</button>
    `;

    qs('#note-edit-btn').addEventListener('click', () => {
      closeFlowbiteModal('noteDetail');
      openEditNoteModal(note);
    });

    qs('#note-del-btn').addEventListener('click', () => {
      promptDelete('note', note.id, `آیا از حذف «${note.title}» مطمئن هستید؟`);
    });
  }

  function deleteNote(id) {
    const filtered = getNotes().filter(x => x.id !== id);
    saveNotes(filtered);
    renderNotes();
    showToast(FA.toastNoteDeleted, 'info');
  }

  /* ==========================================================================
     BACKUP & RESTORE SYSTEM
     ========================================================================== */
  function exportBackup() {
    const data = {
      app: 'کارهای جاواد',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tasks: getTasks(),
      notes: getNotes(),
      geminiApiKey: localStorage.getItem(SK_GEMINI_KEY) || ''
    };

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const filename = `javad-todo-backup-${dateStr}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(FA.backupExported, 'success');
  }

  function handleImportBackup(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!data || (!Array.isArray(data.tasks) && !Array.isArray(data.notes))) {
          showToast(FA.backupInvalid, 'error');
          return;
        }

        if (Array.isArray(data.tasks)) {
          saveTasks(data.tasks);
        }
        if (Array.isArray(data.notes)) {
          saveNotes(data.notes);
        }
        if (data.geminiApiKey) {
          localStorage.setItem(SK_GEMINI_KEY, data.geminiApiKey);
        }

        renderCurrentView();
        closeFlowbiteModal('settings');
        showToast(FA.backupImported, 'success');
      } catch (err) {
        showToast(FA.backupInvalid, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  /* ==========================================================================
     AI SECTION (GEMINI API INTEGRATION & CONFIG)
     ========================================================================== */
  function getAiConfig() {
    const rawKey = localStorage.getItem(SK_GEMINI_KEY) || '';
    const rawModel = localStorage.getItem(SK_GEMINI_MODEL) || 'gemini-2.5-flash';
    const rawBase = localStorage.getItem(SK_GEMINI_BASE_URL) || 'https://generativelanguage.googleapis.com';
    return {
      apiKey: rawKey.trim(),
      model: rawModel.trim() || 'gemini-2.5-flash',
      baseUrl: rawBase.trim().replace(/\/+$/, '') || 'https://generativelanguage.googleapis.com'
    };
  }

  function updateAiBadge() {
    const config = getAiConfig();
    if (aiActiveModelBadge) {
      aiActiveModelBadge.textContent = config.model;
    }
  }

  function populateModelDropdown(selectedModel) {
    if (!aiModelSelect) return;
    let cached = [];
    try {
      cached = JSON.parse(localStorage.getItem(SK_CACHED_MODELS) || '[]');
    } catch (e) {
      cached = [];
    }

    const current = (selectedModel || getAiConfig().model || 'gemini-2.5-flash').trim();
    let modelList = Array.isArray(cached) && cached.length > 0 ? [...cached] : [
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-3.8-flash',
      'gemini-3.1-pro',
      'gemini-2.0-flash',
      'gemini-1.5-flash'
    ];

    if (current && !modelList.includes(current)) {
      modelList.unshift(current);
    }

    aiModelSelect.innerHTML = modelList.map(m => {
      const isSel = m === current ? 'selected' : '';
      return `<option value="${m}" ${isSel}>${m}</option>`;
    }).join('');

    aiModelSelect.value = current;
  }

  async function fetchLiveGeminiModels() {
    const key = aiApiKeyInput ? aiApiKeyInput.value.trim() : '';
    if (!key) {
      showToast('لطفاً ابتدا کلید API را وارد کنید', 'error');
      if (aiApiKeyInput) aiApiKeyInput.focus();
      return;
    }

    const baseUrl = (aiBaseUrlInput ? aiBaseUrlInput.value.trim() : '') || 'https://generativelanguage.googleapis.com';
    const cleanBase = baseUrl.replace(/\/+$/, '');

    if (aiModelsFetchInfo) {
      aiModelsFetchInfo.textContent = 'در حال دریافت جدیدترین مدل‌ها از گوگل...';
      aiModelsFetchInfo.className = 'text-[11px] text-muted mt-1.5 block animate-pulse';
    }

    try {
      const url = `${cleanBase}/v1beta/models?key=${key}`;
      const res = await fetch(url);
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.error?.message || res.statusText || `کد ${res.status}`;
        if (aiModelsFetchInfo) {
          aiModelsFetchInfo.textContent = `خطا در دریافت لیست مدل‌ها: ${errMsg}`;
          aiModelsFetchInfo.className = 'text-[11px] text-red-600 mt-1.5 block';
        }
        return;
      }

      const data = await res.json();
      const models = (data.models || [])
        .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
        .map(m => m.name.replace(/^models\//, ''));

      if (models.length === 0) {
        if (aiModelsFetchInfo) {
          aiModelsFetchInfo.textContent = 'هیچ مدلی با قابلیت گفتگو یا تولید متن یافت نشد.';
          aiModelsFetchInfo.className = 'text-[11px] text-red-600 mt-1.5 block';
        }
        return;
      }

      localStorage.setItem(SK_CACHED_MODELS, JSON.stringify(models));
      const currentSelection = aiModelSelect ? aiModelSelect.value : '';
      populateModelDropdown(models.includes(currentSelection) ? currentSelection : models[0]);

      if (aiModelsFetchInfo) {
        aiModelsFetchInfo.textContent = `✓ تعداد ${toFaDigits(models.length)} مدل جدید دریافت شد و در لیست قرار گرفت.`;
        aiModelsFetchInfo.className = 'text-[11px] text-green-700 mt-1.5 block font-medium';
      }
      showToast('لیست مدل‌های جدید دریافت شد', 'success');
    } catch (err) {
      if (aiModelsFetchInfo) {
        aiModelsFetchInfo.textContent = `عدم امکان ارتباط با سرور: ${err.message}. لطفاً وضعیت VPN را بررسی فرمایید.`;
        aiModelsFetchInfo.className = 'text-[11px] text-red-600 mt-1.5 block';
      }
    }
  }

  function initAiSection() {
    updateAiBadge();

    if (aiChatHistory.length === 0) {
      renderAiWelcome();
    } else {
      renderAiMessages();
    }
  }

  function openAiConfigModal() {
    const config = getAiConfig();
    if (aiApiKeyInput) aiApiKeyInput.value = config.apiKey;
    if (aiBaseUrlInput) aiBaseUrlInput.value = localStorage.getItem(SK_GEMINI_BASE_URL) || '';

    if (aiTestStatus) {
      aiTestStatus.className = 'mt-2.5 text-xs leading-relaxed hidden p-2.5 rounded-xl border';
      aiTestStatus.textContent = '';
    }
    if (aiModelsFetchInfo) {
      aiModelsFetchInfo.className = 'text-[11px] text-muted mt-1.5 hidden';
      aiModelsFetchInfo.textContent = '';
    }

    populateModelDropdown(config.model);

    openFlowbiteModal('aiConfig');
    setTimeout(() => {
      if (aiApiKeyInput && !aiApiKeyInput.value) aiApiKeyInput.focus();
    }, 250);
  }

  function handleSaveAiConfig() {
    const rawKey = aiApiKeyInput ? aiApiKeyInput.value.trim() : '';
    const selectedModel = aiModelSelect ? aiModelSelect.value.trim() : '';
    const rawBaseUrl = aiBaseUrlInput ? aiBaseUrlInput.value.trim() : '';

    if (rawKey) {
      localStorage.setItem(SK_GEMINI_KEY, rawKey);
    } else {
      localStorage.removeItem(SK_GEMINI_KEY);
    }

    if (selectedModel) {
      localStorage.setItem(SK_GEMINI_MODEL, selectedModel);
    }

    if (rawBaseUrl) {
      localStorage.setItem(SK_GEMINI_BASE_URL, rawBaseUrl);
    } else {
      localStorage.removeItem(SK_GEMINI_BASE_URL);
    }

    updateAiBadge();
    closeFlowbiteModal('aiConfig');
    showToast(FA.aiApiKeySaved, 'success');
  }

  async function testAiConnection() {
    const key = aiApiKeyInput ? aiApiKeyInput.value.trim() : '';
    if (!key) {
      setAiTestStatus('لطفاً ابتدا کلید API را وارد کنید.', 'error');
      aiApiKeyInput.focus();
      return;
    }

    const model = aiModelSelect ? aiModelSelect.value : 'gemini-3.8-flash';
    const baseUrl = (aiBaseUrlInput ? aiBaseUrlInput.value.trim() : '') || 'https://generativelanguage.googleapis.com';
    const cleanBase = baseUrl.replace(/\/+$/, '');

    setAiTestStatus('در حال بررسی و ارتباط با سرور...', 'pending');

    try {
      const url = `${cleanBase}/v1beta/models/${model}:generateContent?key=${key}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: 'پاسخ کوتاه بده: سلام' }]
          }
        ]
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'تایید شد';
        setAiTestStatus(`✓ اتصال موفقیت‌آمیز بود! پاسخ از ${model}: «${reply.trim()}»`, 'success');
      } else {
        const errJson = await res.json().catch(() => null);
        const errMessage = errJson?.error?.message || res.statusText || `کد ${res.status}`;
        if (res.status === 403 || errMessage.toLowerCase().includes('location')) {
          setAiTestStatus('خطای ۴۰۳ گوگل (تحریم منطقه‌ای): دسترسی از IP اینترنت شما مسدود است. لطفاً وی‌پی‌ان (VPN) خود را روشن کنید یا از یک آدرس پروکسی استفاده فرمایید.', 'error');
        } else if (res.status === 400 && errMessage.includes('API_KEY')) {
          setAiTestStatus('خطای ۴۰۰: کلید API نامعتبر است. لطفاً کلید دریافتی از Google AI Studio را مجدداً کپی کنید.', 'error');
        } else if (res.status === 404) {
          setAiTestStatus(`خطای ۴۰۴: مدل «${model}» فعال نیست. لطفاً مدل دیگری انتخاب کنید.`, 'error');
        } else {
          setAiTestStatus(`خطا از سرور گوگل (کد ${res.status}): ${errMessage}`, 'error');
        }
      }
    } catch (err) {
      setAiTestStatus(`عدم برقراری ارتباط با سرور: در صورت استفاده از اینترنت ایران، فعال بودن وی‌پی‌ان (VPN) ضروری است. (${err.message})`, 'error');
    }
  }

  function setAiTestStatus(text, type) {
    if (!aiTestStatus) return;
    aiTestStatus.classList.remove('hidden', 'bg-green-50', 'text-green-800', 'border-green-200', 'bg-red-50', 'text-red-800', 'border-red-200', 'bg-gray-50', 'text-gray-800', 'border-borderwarm');

    if (type === 'success') {
      aiTestStatus.classList.add('bg-green-50', 'text-green-800', 'border-green-200');
    } else if (type === 'error') {
      aiTestStatus.classList.add('bg-red-50', 'text-red-800', 'border-red-200');
    } else {
      aiTestStatus.classList.add('bg-gray-50', 'text-gray-800', 'border-borderwarm');
    }
    aiTestStatus.textContent = text;
  }

  function renderAiWelcome() {
    aiChatArea.innerHTML = `
      <div class="flex items-start gap-2.5 max-w-[85%]">
        <div class="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">AI</div>
        <div class="p-3 bg-white border border-borderwarm rounded-2xl rounded-tr-none text-xs text-charcoal shadow-soft leading-relaxed">
          <p class="font-bold mb-1">دستیار خلاصه کارها و زمان‌بندی‌ها</p>
          <p class="text-muted">برای دریافت گزارش کوتاه، دکمه «خلاصه» را لمس کنید یا سوال مورد نظر خود درباره کارها را بنویسید.</p>
        </div>
      </div>
    `;
  }

  function renderAiMessages() {
    aiChatArea.innerHTML = aiChatHistory.map(msg => {
      const isUser = msg.role === 'user';
      if (isUser) {
        return `
          <div class="flex items-start justify-end gap-2.5">
            <div class="p-3.5 bg-primary-600 text-white rounded-2xl rounded-tl-none text-xs max-w-[85%] shadow-soft leading-relaxed whitespace-pre-wrap" dir="auto">${esc(msg.text)}</div>
          </div>
        `;
      } else {
        return `
          <div class="flex items-start gap-2.5 max-w-[90%]">
            <div class="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">AI</div>
            <div class="p-3.5 bg-white border border-borderwarm rounded-2xl rounded-tr-none text-xs text-charcoal shadow-soft leading-relaxed whitespace-pre-wrap" dir="auto">${formatAiMarkdown(msg.text)}</div>
          </div>
        `;
      }
    }).join('');

    aiChatArea.scrollTop = aiChatArea.scrollHeight;
  }

  function formatAiMarkdown(text) {
    if (!text) return '';
    let formatted = esc(text);
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    return formatted;
  }

  function appendAiThinking() {
    const thinkingEl = document.createElement('div');
    thinkingEl.id = 'ai-thinking-bubble';
    thinkingEl.className = 'flex items-start gap-2.5 max-w-[85%]';
    thinkingEl.innerHTML = `
      <div class="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">AI</div>
      <div class="p-3 bg-white border border-borderwarm rounded-2xl rounded-tr-none text-xs text-muted shadow-soft flex items-center gap-2">
        <span class="inline-block w-2 h-2 rounded-full bg-primary-600 animate-pulse"></span>
        <span class="inline-block w-2 h-2 rounded-full bg-primary-600 animate-pulse" style="animation-delay: 0.2s"></span>
        <span class="inline-block w-2 h-2 rounded-full bg-primary-600 animate-pulse" style="animation-delay: 0.4s"></span>
        <span>${FA.aiThinking}</span>
      </div>
    `;
    aiChatArea.appendChild(thinkingEl);
    aiChatArea.scrollTop = aiChatArea.scrollHeight;
  }

  function removeAiThinking() {
    const el = qs('#ai-thinking-bubble');
    if (el) el.remove();
  }

  function buildAppContextPrompt() {
    const tasks = getTasks();
    const activeTasks = tasks.filter(t => !t.done);
    const finishedTasks = tasks.filter(t => t.done);
    const now = new Date();
    const nowIso = now.toISOString();

    let summary = `اطلاعات سیستمی زمان جاری:\n`;
    summary += `تاریخ و زمان امروز: ${formatFaCurrentDay()} (میلادی: ${nowIso.slice(0, 10)} - ساعت: ${nowIso.slice(11, 16)})\n\n`;

    summary += `کارهای فعال (${toFaDigits(activeTasks.length)} مورد):\n`;
    if (activeTasks.length === 0) {
      summary += 'هیچ کار فعالی ثبت نشده است.\n';
    } else {
      activeTasks.forEach((t, i) => {
        const catName = FA.categories[t.category] || t.category;
        const prioName = FA.priorities[t.priority] || t.priority;
        summary += `${i + 1}. [${catName}] [اولویت: ${prioName}] ${t.title}`;
        if (t.reminderAt) {
          summary += ` [یادآور/زمان‌بندی: ${formatFaDate(t.reminderAt)}]`;
        }
        if (t.description) {
          summary += ` - توضیحات: ${t.description}`;
        }
        summary += '\n';
      });
    }

    if (finishedTasks.length > 0) {
      summary += `\nکارهای تکمیل‌شده اخیر (${toFaDigits(finishedTasks.length)} مورد):\n`;
      finishedTasks.slice(0, 5).forEach((t, i) => {
        const catName = FA.categories[t.category] || t.category;
        summary += `${i + 1}. [${catName}] ${t.title}\n`;
      });
    }

    const notes = getNotes();
    if (notes.length > 0) {
      summary += `\nیادداشت‌های کاربر (${toFaDigits(notes.length)} مورد):\n`;
      notes.slice(0, 8).forEach((n, i) => {
        const catName = n.category ? (FA.categories[n.category] || n.category) : 'عمومی';
        summary += `${i + 1}. [${catName}] ${n.title ? n.title + ': ' : ''}${n.content.slice(0, 70)}\n`;
      });
    }

    return summary;
  }

  async function callGeminiApi(userPrompt) {
    const config = getAiConfig();
    if (!config.apiKey) {
      showToast(FA.aiApiKeyRequired, 'error');
      openAiConfigModal();
      return null;
    }

    if (!navigator.onLine) {
      showToast(FA.aiNoInternet, 'error');
      return null;
    }

    const context = buildAppContextPrompt();
    const strictSystemInstruction = `دستورالعمل حیاتی و اکید هوش مصنوعی:
۱. در صورتی که کاربر درخواست افزودن، ثبت یا ایجاد کار جدیدی را داده باشد (مثلاً «یک کار اضافه کن»، «تماس با ساسان رو بذار تو کارها»، «add task»، «یادآور تنظیم کن» و موارد مشابه):
حتماً در پاسخ خود باید یک بلوک عملیاتی دقیقاً با فرمت زیر درج کنی:
ACTION:ADD_TASK
{"title":"عنوان دقیق کار","category":"Armin Department|Latifi Store|Gold Sassan|KhoshKam","priority":"urgent|normal","reminderAt":"YYYY-MM-DDTHH:MM" یا null,"description":"توضیحات یا خالی"}

راهنمای مقادیر:
- category: باید دقیقاً یکی از این ۴ مقدار انگلیسی باشد:
  * "Armin Department" (املاک آرمین)
  * "Latifi Store" (لطیفی استور)
  * "Gold Sassan" (طلا ساسان)
  * "KhoshKam" (خوشکام)
  اگر کاربر نام دسته‌بندی را مشخص نکرده بود، بر اساس متن مرتبط‌ترین را انتخاب کن یا به عنوان پیش‌فرض "Armin Department" قرار بده.
- priority: فقط یکی از دو مقدار "urgent" (فوری) یا "normal" (عادی).
- reminderAt: اگر کاربر ساعت یا روزی برای یادآوری تعیین کرده است، آن را بر مبنای تاریخ میلادی جاری محاسبه کن و به فرمت ISO مثل "2026-10-30T10:00" بنویس؛ اگر مشخص نشده بود مقدار null بگذار.
- description: توضیحات کار در صورت وجود، یا رشته خالی "".

۲. لحن و سبک پاسخ به کاربر:
پاسخ شما باید بسیار کوتاه، فشرده و صرفاً یک خلاصه در چند پاراگراف باشد بدون هیچ کلمه اضافی.
اکیداً هیچ کلمه اضافی، سلام، احوالپرسی، تعارف، تشکر، مقدمه‌چینی، نتیجه‌گیری، جملات انگیزشی یا عبارات پایانی ننویسید.
فقط و فقط مستقیماً از کارها (tasks)، اولویت‌ها، وضعیت انجام آن‌ها و زمان‌بندی‌ها و یادآورها (schedules) صحبت کنید.
اگر کاری اضافه کردی، صرفاً در یک خط کوتاه ذکر کن که کار با مشخصات مربوطه به لیست اضافه شد.`;

    const payload = {
      system_instruction: {
        parts: [{ text: strictSystemInstruction }]
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${strictSystemInstruction}\n\n${context}\n\nدرخواست کاربر:\n${userPrompt}`
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 600,
        temperature: 0.1
      }
    };

    const url = `${config.baseUrl}/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (networkErr) {
      throw new Error('عدم امکان برقراری ارتباط با سرور گوگل. لطفاً اتصال اینترنت یا روشن بودن فیلترشکن (VPN) را بررسی فرمایید.');
    }

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      const errMessage = errJson?.error?.message || response.statusText || `کد خطا: ${response.status}`;
      if (response.status === 403 || errMessage.toLowerCase().includes('location')) {
        throw new Error('تحریم منطقه‌ای گوگل (خطای ۴۰۳): دسترسی به این سرویس از IP شما مسدود است. لطفاً وی‌پی‌ان (VPN) خود را روشن کنید یا در تنظیمات از پروکسی استفاده کنید.');
      }
      if (response.status === 400 && errMessage.includes('API_KEY')) {
        throw new Error('کلید API وارد شده نامعتبر است (خطای ۴۰۰). لطفاً کلید خود را در دکمه تنظیمات بالای صفحه بررسی کنید.');
      }
      if (response.status === 404) {
        throw new Error(`مدل «${config.model}» فعال نیست (خطای ۴۰۴). لطفاً از دکمه تنظیمات بالای صفحه مدل دیگری انتخاب فرمایید.`);
      }
      throw new Error(`پاسخ ناموفق از گوگل (کد ${response.status}): ${errMessage}`);
    }

    const resData = await response.json();
    const candidate = resData.candidates && resData.candidates[0];
    const text = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0] && candidate.content.parts[0].text;

    if (!text) {
      throw new Error('پاسخی از مدل دریافت نشد. ممکن است به دلیل سیاست‌های محتوایی مسدود شده باشد.');
    }

    return text;
  }

  async function sendAiMessage(promptText) {
    if (isAiResponding) return;
    const cleanPrompt = promptText.trim();
    if (!cleanPrompt) return;

    aiChatHistory.push({ role: 'user', text: cleanPrompt });
    renderAiMessages();
    aiChatInput.value = '';

    isAiResponding = true;
    appendAiThinking();

    try {
      const responseText = await callGeminiApi(cleanPrompt);
      removeAiThinking();
      if (responseText) {
        // Parse any ACTION:ADD_TASK blocks
        const actionRegex = /ACTION:ADD_TASK\s*(\{[\s\S]*?\})/g;
        let match;
        const addedTasks = [];
        while ((match = actionRegex.exec(responseText)) !== null) {
          try {
            const rawJson = match[1].replace(/[\u200B-\u200D\uFEFF]/g, '');
            const data = JSON.parse(rawJson);
            if (data && data.title) {
              let cat = data.category;
              const validCats = ['Armin Department', 'Latifi Store', 'Gold Sassan', 'KhoshKam'];
              if (!validCats.includes(cat)) {
                if (/لطیفی/i.test(cat)) cat = 'Latifi Store';
                else if (/ساسان/i.test(cat)) cat = 'Gold Sassan';
                else if (/خوشکام/i.test(cat)) cat = 'KhoshKam';
                else cat = 'Armin Department';
              }
              const prio = (data.priority === 'urgent') ? 'urgent' : 'normal';
              let rem = data.reminderAt || null;
              if (rem && isNaN(new Date(rem).getTime())) rem = null;
              const desc = data.description || '';
              const created = createTask(data.title, desc, cat, prio, rem);
              if (created) addedTasks.push(created);
            }
          } catch (pe) {
            console.error('Error parsing AI action JSON:', pe);
          }
        }

        // Clean response from raw ACTION block
        let cleanText = responseText.replace(/ACTION:ADD_TASK\s*(\{[\s\S]*?\})/g, '').trim();
        if (addedTasks.length > 0) {
          const addedList = addedTasks.map(t => {
            const catName = FA.categories[t.category] || t.category;
            const prioName = FA.priorities[t.priority] || t.priority;
            const remText = t.reminderAt ? ` (یادآور: ${formatFaDate(t.reminderAt)})` : '';
            return `✓ **${esc(t.title)}** [${catName} - ${prioName}]${remText}`;
          }).join('\n');

          if (cleanText) {
            cleanText = `${cleanText}\n\n${addedList}`;
          } else {
            cleanText = `کار جدید با موفقیت اضافه شد:\n${addedList}`;
          }
        }

        aiChatHistory.push({ role: 'assistant', text: cleanText });
        renderAiMessages();
      }
    } catch (e) {
      removeAiThinking();
      showToast(FA.aiError, 'error');
      aiChatHistory.push({
        role: 'assistant',
        text: `⚠️ **خطا در برقراری ارتباط با جمینای:**\n\n${e.message}\n\n💡 *برای رفع مشکل، روی دکمه «تنظیمات» در بالای صفحه بزنید و اتصال کلید را تست کنید.*`
      });
      renderAiMessages();
    } finally {
      isAiResponding = false;
    }
  }

  /* ==========================================================================
     CONFIRM DELETE MODAL
     ========================================================================== */
  function promptDelete(type, id, titleText) {
    pendingDeleteType = type;
    pendingDeleteId = id;
    confirmTitle.textContent = titleText || FA.confirmDeleteTitle;
    openFlowbiteModal('confirm');
  }

  confirmDelBtn.addEventListener('click', () => {
    if (pendingDeleteType === 'task' && pendingDeleteId) {
      deleteTask(pendingDeleteId);
      closeFlowbiteModal('confirm');
      closeFlowbiteModal('taskDetail');
      pendingDeleteId = null;
    } else if (pendingDeleteType === 'note' && pendingDeleteId) {
      deleteNote(pendingDeleteId);
      closeFlowbiteModal('confirm');
      closeFlowbiteModal('noteDetail');
      pendingDeleteId = null;
    }
  });

  /* ==========================================================================
     EVENT BINDINGS
     ========================================================================== */
  // Keypad
  qsa('.key-btn').forEach(k => {
    k.addEventListener('click', () => handlePinKey(k.dataset.key));
  });

  window.addEventListener('keydown', (e) => {
    if (lockScreen && !lockScreen.classList.contains('pointer-events-none')) {
      if ((e.key >= '0' && e.key <= '9') || (e.key >= '۰' && e.key <= '۹')) {
        const map = { '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9' };
        const digit = map[e.key] || e.key;
        handlePinKey(digit);
      } else if (e.key === 'Backspace') {
        handlePinKey('delete');
      }
    }
  });

  // Settings Modal Open
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => openFlowbiteModal('settings'));
  }

  // Backup Export & Import
  if (backupExportBtn) {
    backupExportBtn.addEventListener('click', exportBackup);
  }
  if (backupImportInput) {
    backupImportInput.addEventListener('change', handleImportBackup);
  }

  // Bottom Navigation (3 Tabs)
  bottomNavItems.forEach(item => {
    item.addEventListener('click', () => switchTab(item.dataset.tab));
  });

  // Category Filters (Tasks)
  categoryFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryFilters.forEach(b => {
        b.classList.remove('bg-primary-600', 'text-white', 'border-primary-600');
        b.classList.add('bg-ivory', 'text-muted', 'border-borderwarm');
      });
      btn.classList.add('bg-primary-600', 'text-white', 'border-primary-600');
      btn.classList.remove('bg-ivory', 'text-muted', 'border-borderwarm');
      activeCategory = btn.dataset.filter;
      renderTasks();
    });
  });

  // Priority Filter Pills (Tasks)
  priorityBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      priorityBtns.forEach(b => {
        b.classList.remove('bg-primary-50', 'text-primary-600', 'border-primary-200');
        b.classList.add('bg-white', 'text-muted', 'border-borderwarm');
      });
      btn.classList.add('bg-primary-50', 'text-primary-600', 'border-primary-200');
      btn.classList.remove('bg-white', 'text-muted');
      activePriority = btn.dataset.priority;
      renderTasks();
    });
  });

  // Finished Sub-Filter Pills (Tasks)
  finishedSubBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      finishedSubBtns.forEach(b => {
        b.classList.remove('bg-primary-50', 'text-primary-600', 'border-primary-200');
        b.classList.add('bg-white', 'text-muted', 'border-borderwarm');
      });
      btn.classList.add('bg-primary-50', 'text-primary-600', 'border-primary-200');
      btn.classList.remove('bg-white', 'text-muted');
      activeFinishedCat = btn.dataset.fsub;
      renderTasks();
    });
  });

  // Notes Category Filters
  notesCategoryFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      notesCategoryFilters.forEach(b => {
        b.classList.remove('bg-primary-600', 'text-white', 'border-primary-600');
        b.classList.add('bg-ivory', 'text-muted', 'border-borderwarm');
      });
      btn.classList.add('bg-primary-600', 'text-white', 'border-primary-600');
      btn.classList.remove('bg-ivory', 'text-muted', 'border-borderwarm');
      activeNoteCategory = btn.dataset.nfilter;
      renderNotes();
    });
  });

  // Floating Action Buttons
  taskFab.addEventListener('click', openAddTaskModal);
  notesFab.addEventListener('click', openAddNoteModal);

  // Add Task Modal Category Selection
  addCatChoices.forEach(card => {
    card.addEventListener('click', () => {
      addCatChoices.forEach(c => {
        c.classList.remove('border-primary-600', 'bg-primary-50/30');
        c.querySelector('.choice-check').classList.add('hidden');
      });
      card.classList.add('border-primary-600', 'bg-primary-50/30');
      card.querySelector('.choice-check').classList.remove('hidden');
      selectedAddCategory = card.dataset.cat;
    });
  });

  // Add Task Modal Priority Selection
  addPriorityBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      addPriorityBtns.forEach(b => {
        b.classList.remove('text-primary-600', 'bg-primary-50', 'border-primary-200');
        b.classList.add('text-gray-900', 'bg-white', 'border-borderwarm');
      });
      btn.classList.add('text-primary-600', 'bg-primary-50', 'border-primary-200');
      btn.classList.remove('bg-white');
      selectedAddPriority = btn.dataset.priority;
    });
  });

  addTaskTitle.addEventListener('input', () => addTaskTitle.classList.remove('border-primary-600', 'ring-2', 'ring-primary-200'));
  addTaskSaveBtn.addEventListener('click', handleSaveNewTask);

  // Note Modal Category Selection
  noteCatChoices.forEach(card => {
    card.addEventListener('click', () => {
      noteCatChoices.forEach(c => {
        c.classList.remove('bg-primary-600', 'text-white', 'border-primary-600');
        c.classList.add('bg-ivory', 'text-muted', 'border-borderwarm');
      });
      card.classList.add('bg-primary-600', 'text-white', 'border-primary-600');
      card.classList.remove('bg-ivory', 'text-muted', 'border-borderwarm');
      selectedNoteCategory = card.dataset.notecat;
    });
  });

  // Task List Click Delegation
  taskListEl.addEventListener('click', (e) => {
    const checkBtn = e.target.closest('[data-check]');
    if (checkBtn) {
      e.stopPropagation();
      const id = checkBtn.dataset.check;
      const card = checkBtn.closest('.task-card');
      const roundBox = checkBtn.querySelector('.round-check');
      const task = getTask(id);
      if (!task) return;

      if (!task.done) {
        completeTask(id, card, roundBox);
      } else {
        uncompleteTask(id);
      }
      return;
    }

    const card = e.target.closest('.task-card');
    if (card && card.dataset.id) {
      openTaskDetailModal(card.dataset.id);
    }
  });

  // Notes Search & List Delegation
  notesSearchInput.addEventListener('input', (e) => {
    notesSearchQuery = e.target.value;
    notesSearchClear.classList.toggle('hidden', !notesSearchQuery);
    renderNotes();
  });

  notesSearchClear.addEventListener('click', () => {
    notesSearchInput.value = '';
    notesSearchQuery = '';
    notesSearchClear.classList.add('hidden');
    renderNotes();
    notesSearchInput.focus();
  });

  notesListEl.addEventListener('click', (e) => {
    const card = e.target.closest('.note-card');
    if (card && card.dataset.id) {
      openNoteDetailModal(card.dataset.id);
    }
  });

  noteTitleInput.addEventListener('input', () => noteTitleInput.classList.remove('border-primary-600', 'ring-2', 'ring-primary-200'));
  noteContentInput.addEventListener('input', () => noteContentInput.classList.remove('border-primary-600', 'ring-2', 'ring-primary-200'));
  noteSaveBtn.addEventListener('click', handleSaveNote);

  // AI Section Bindings
  if (aiSettingsBtn) {
    aiSettingsBtn.addEventListener('click', openAiConfigModal);
  }

  if (aiConfigSaveBtn) {
    aiConfigSaveBtn.addEventListener('click', handleSaveAiConfig);
  }

  if (aiTestBtn) {
    aiTestBtn.addEventListener('click', testAiConnection);
  }

  if (aiApiToggleVis) {
    aiApiToggleVis.addEventListener('click', () => {
      const type = aiApiKeyInput.type === 'password' ? 'text' : 'password';
      aiApiKeyInput.type = type;
    });
  }

  if (aiFetchModelsBtn) {
    aiFetchModelsBtn.addEventListener('click', fetchLiveGeminiModels);
  }

  if (aiSummarizeBtn) {
    aiSummarizeBtn.addEventListener('click', () => {
      sendAiMessage('یک خلاصه بسیار کوتاه در چند پاراگراف صرفاً درباره کارها و زمان‌بندی‌های من ارائه بده. بدون هیچ کلمه اضافی یا احوالپرسی.');
    });
  }

  if (aiSendBtn) {
    aiSendBtn.addEventListener('click', () => {
      sendAiMessage(aiChatInput.value);
    });
  }

  if (aiChatInput) {
    aiChatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendAiMessage(aiChatInput.value);
      }
    });
  }

  if (aiClearBtn) {
    aiClearBtn.addEventListener('click', () => {
      aiChatHistory = [];
      renderAiWelcome();
      showToast('گفتگو پاک شد', 'info');
    });
  }

  /* ==========================================================================
     INIT
     ========================================================================== */
  function init() {
    initFlowbiteModals();
    updateHeaderDate();
    updateFinishedCount();

    // Check reminders periodically
    checkReminders();
    setInterval(checkReminders, 30000);

    const activePill = qs('.filter-pill[data-filter="all"]');
    if (activePill) {
      activePill.classList.add('bg-primary-600', 'text-white', 'border-primary-600');
      activePill.classList.remove('bg-ivory', 'text-muted');
    }

    if (isPinValid()) {
      lockScreen.style.display = 'none';
      appShell.classList.remove('hidden');
      renderCurrentView();
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js', { updateViaCache: 'none' })
        .then(reg => reg.update())
        .catch(err => console.warn('SW register error:', err));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
