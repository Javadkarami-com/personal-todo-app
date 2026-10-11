(function () {
  'use strict';

  /* ==========================================================================
     STORAGE KEYS & CONSTANTS
     Internal keys and category/priority IDs remain identical to protect data.
     ========================================================================== */
  const CORRECT_PIN = '2020';
  const PIN_EXPIRY  = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const SK_TASKS    = 'todo_tasks';
  const SK_NOTES    = 'todo_notes';
  const SK_PIN_TS   = 'todo_pin_ts';

  /* ==========================================================================
     APP STATE
     ========================================================================== */
  let activeTab           = 'tasks';      // 'tasks' | 'notes'
  let activeCategory      = 'all';        // 'all' | 'Armin Department' | 'Gold Sassan' | 'KhoshKam' | 'finished'
  let activePriority      = 'all';        // 'all' | 'urgent' | 'normal'
  let activeFinishedCat   = 'all';        // 'all' | 'Armin Department' | 'Gold Sassan' | 'KhoshKam'

  let pinInput            = '';
  let openTaskId          = null;
  let openNoteId          = null;

  let selectedAddCategory = '';
  let selectedAddPriority = 'normal';

  let notesSearchQuery    = '';
  let pendingDeleteType   = null;         // 'task' | 'note'
  let pendingDeleteId     = null;

  // Flowbite Modal instances
  let flowbiteModals = {};

  /* ==========================================================================
     DOM REFERENCES
     ========================================================================== */
  const qs  = (s, p) => (p || document).querySelector(s);
  const qsa = (s, p) => (p || document).querySelectorAll(s);

  // Lock Screen
  const lockScreen       = qs('#lock-screen');
  const pinDotsEl        = qs('#pin-dots');
  const pinErrorEl       = qs('#pin-error');
  const appShell         = qs('#app');
  const pageTitleEl      = qs('#page-title');
  const currentDateEl    = qs('#current-date');

  // Views & Bottom Nav
  const viewTasks        = qs('#view-tasks');
  const viewNotes        = qs('#view-notes');
  const bottomNavItems   = qsa('.nav-item');

  // Filter Strips
  const categoryFilters  = qsa('#category-filters .filter-pill');
  const activePriorityPills = qs('#active-priority-pills');
  const priorityBtns     = qsa('#active-priority-pills .sub-pill');
  const finishedSubPills = qs('#finished-sub-pills');
  const finishedSubBtns  = qsa('#finished-sub-pills .sub-pill');
  const finishedCountEl  = qs('#finished-count');

  // Task List & Empty
  const taskListEl       = qs('#task-list');
  const taskEmptyBox     = qs('#task-empty-state');
  const taskEmptyIcon    = qs('#task-empty-icon');
  const taskEmptyTitle   = qs('#task-empty-title');
  const taskEmptySub     = qs('#task-empty-sub');
  const taskFab          = qs('#task-fab');

  // Notes Elements
  const notesListEl      = qs('#notes-list');
  const notesSearchInput = qs('#notes-search-input');
  const notesSearchClear = qs('#notes-search-clear');
  const notesEmptyBox    = qs('#notes-empty-state');
  const notesEmptyTitle  = qs('#notes-empty-title');
  const notesEmptySub    = qs('#notes-empty-sub');
  const notesFab         = qs('#notes-fab');

  // Add Task Modal
  const addTaskModalEl   = qs('#add-task-modal');
  const addCatChoices    = qsa('.cat-choice', qs('#add-cat-selector'));
  const addPriorityBtns  = qsa('#add-priority-group .priority-btn');
  const addTaskTitle     = qs('#add-task-title');
  const addTaskDesc      = qs('#add-task-desc');
  const addTaskSaveBtn   = qs('#add-task-save-btn');

  // Task Details Modal
  const detailTaskModalEl = qs('#detail-task-modal');
  const taskDetailHead   = qs('#task-detail-title');
  const taskDetailSub    = qs('#task-detail-subtitle');
  const taskDetailBody   = qs('#task-detail-body');
  const taskDetailFooter = qs('#task-detail-footer');

  // Note Modals
  const noteModalEl      = qs('#note-modal');
  const noteModalTitle   = qs('#note-modal-heading');
  const noteTitleInput   = qs('#note-title-input');
  const noteContentInput = qs('#note-content-input');
  const noteSaveBtn      = qs('#note-save-btn');

  const noteDetailModalEl= qs('#note-detail-modal');
  const noteDetailSub    = qs('#note-detail-sub');
  const noteDetailBody   = qs('#note-detail-body');
  const noteDetailFooter = qs('#note-detail-footer');

  // Confirm Modal
  const confirmModalEl   = qs('#confirm-modal');
  const confirmTitle     = qs('#confirm-title');
  const confirmDelBtn    = qs('#confirm-del-btn');

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
    setTimeout(dismiss, 2800);
  }

  /* ==========================================================================
     FLOWBITE MODAL CONTROLLER
     ========================================================================== */
  function initFlowbiteModals() {
    if (typeof Flowbite !== 'undefined' && Flowbite.Modal) {
      const modalOptions = {
        backdrop: 'static',
        backdropClasses: 'bg-charcoal/50 fixed inset-0 z-40 backdrop-blur-sm',
        closable: true
      };

      flowbiteModals.addTask = new Flowbite.Modal(addTaskModalEl, modalOptions);
      flowbiteModals.taskDetail = new Flowbite.Modal(detailTaskModalEl, modalOptions);
      flowbiteModals.noteModal = new Flowbite.Modal(noteModalEl, modalOptions);
      flowbiteModals.noteDetail = new Flowbite.Modal(noteDetailModalEl, modalOptions);
      flowbiteModals.confirm = new Flowbite.Modal(confirmModalEl, modalOptions);
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

      flowbiteModals.addTask = createFallbackModal(addTaskModalEl);
      flowbiteModals.taskDetail = createFallbackModal(detailTaskModalEl);
      flowbiteModals.noteModal = createFallbackModal(noteModalEl);
      flowbiteModals.noteDetail = createFallbackModal(noteDetailModalEl);
      flowbiteModals.confirm = createFallbackModal(confirmModalEl);
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
    // KhoshKam
    return `
      <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-white border border-borderwarm text-[#1A5FA8] flex-shrink-0">
        <span class="w-3.5 h-3.5 rounded bg-white p-0.5 flex items-center justify-center">
          <img src="assets/favicon.png" alt="${label}" class="w-full h-full object-contain" />
        </span>
        <span>${label}</span>
      </span>`;
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
     TAB SWITCHING (Tasks vs Notes)
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
      renderTasks();
    } else {
      pageTitleEl.textContent = FA.notes;
      viewNotes.classList.remove('hidden');
      viewTasks.classList.add('hidden');
      renderNotes();
    }
  }

  function renderCurrentView() {
    updateHeaderDate();
    updateFinishedCount();
    if (activeTab === 'tasks') {
      renderTasks();
    } else {
      renderNotes();
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
  function createTask(title, desc, category, priority) {
    const tasks = getTasks();
    const now = new Date().toISOString();
    tasks.unshift({
      id: uid(),
      title: title.trim(),
      description: desc.trim(),
      category: category,
      priority: priority || 'normal',
      done: false,
      createdAt: now,
      updatedAt: now,
      completedAt: null
    });
    saveTasks(tasks);
    renderTasks();
    showToast(FA.toastTaskSaved, 'success');
  }

  function completeTask(id, cardEl, roundBox) {
    roundBox.classList.add('animate-check-pop', 'bg-primary-600', 'border-primary-600');
    const checkSvg = roundBox.querySelector('svg');
    if (checkSvg) checkSvg.classList.remove('hidden');

    setTimeout(() => {
      // Slide away in RTL: move towards left (-translate-x-8 in RTL or translate-x-8)
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

    createTask(title, addTaskDesc.value, selectedAddCategory, selectedAddPriority);
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
        <div class="grid grid-cols-3 gap-2" id="edit-cat-selector">
          <div class="cat-choice flex flex-col items-center justify-center p-3 rounded-2xl border-2 ${task.category === 'Armin Department' ? 'border-primary-600 bg-primary-50/30' : 'border-borderwarm'} bg-white cursor-pointer relative text-center" data-cat="Armin Department" role="button">
            <div class="w-9 h-9 rounded-xl bg-charcoal p-1.5 flex items-center justify-center mb-1.5 flex-shrink-0">
              <img src="assets/armin.png" alt="آرمین" class="w-full h-full object-contain" />
            </div>
            <span class="text-xs font-semibold text-charcoal truncate w-full">دپارتمان آرمین</span>
            <span class="choice-check absolute top-1.5 end-1.5 w-4 h-4 rounded-full bg-primary-600 text-white ${task.category === 'Armin Department' ? 'flex' : 'hidden'} items-center justify-center">
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
      updateTask(openTaskId, {
        title: t,
        description: qs('#edit-task-desc').value.trim(),
        category: editCategory,
        priority: editPriority
      });
      const fresh = getTask(openTaskId);
      if (fresh) {
        taskDetailHead.textContent = FA.taskDetails;
        renderTaskDetailView(fresh);
      }
    });
  }

  /* ==========================================================================
     NOTES SECTION
     ========================================================================== */
  function renderNotes() {
    const all = getNotes();
    let list = all.slice();

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
        <h4 class="text-sm font-bold text-charcoal truncate mb-1.5" dir="auto">${esc(n.title)}</h4>
        <p class="text-xs text-muted line-clamp-2 mb-2 leading-relaxed" dir="auto">${esc(n.content || '')}</p>
        <span class="text-[11px] text-muted block">${formatFaDate(n.updatedAt || n.createdAt)}</span>
      </div>
    `).join('');
  }

  function openAddNoteModal() {
    openNoteId = null;
    noteModalTitle.textContent = FA.newNote;
    noteTitleInput.value = '';
    noteContentInput.value = '';
    noteTitleInput.classList.remove('border-primary-600', 'ring-2', 'ring-primary-200');
    noteContentInput.classList.remove('border-primary-600', 'ring-2', 'ring-primary-200');
    openFlowbiteModal('noteModal');
    setTimeout(() => noteTitleInput.focus(), 250);
  }

  function openEditNoteModal(note) {
    openNoteId = note.id;
    noteModalTitle.textContent = FA.editNote;
    noteTitleInput.value = note.title;
    noteContentInput.value = note.content;
    noteTitleInput.classList.remove('border-primary-600', 'ring-2', 'ring-primary-200');
    noteContentInput.classList.remove('border-primary-600', 'ring-2', 'ring-primary-200');
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
      <div>
        <span class="block mb-1 text-xs font-semibold text-muted">${FA.titleLabel}</span>
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
        // Map Persian digit to standard ascii for comparison with 2020
        const map = { '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9' };
        const digit = map[e.key] || e.key;
        handlePinKey(digit);
      } else if (e.key === 'Backspace') {
        handlePinKey('delete');
      }
    }
  });

  // Bottom Navigation
  bottomNavItems.forEach(item => {
    item.addEventListener('click', () => switchTab(item.dataset.tab));
  });

  // Category Filters
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

  // Priority Filter Pills
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

  // Finished Sub-Filter Pills
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

  /* ==========================================================================
     INIT
     ========================================================================== */
  function init() {
    initFlowbiteModals();
    updateHeaderDate();
    updateFinishedCount();

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
