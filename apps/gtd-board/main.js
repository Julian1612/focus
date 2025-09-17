// --- App Constants ---
const APP_ID = 'gtd-board';
const CATEGORIES = {
    work:     { label: 'Work',     color: '#5e5ce6' },
    personal: { label: 'Personal', color: '#32d74b' },
    study:    { label: 'Study',    color: '#64d2ff' },
    urgent:   { label: 'Urgent',   color: '#ff9f0a' },
};
const COLUMNS = {
    'gtd-inbox':    { title: 'Inbox' },
    'gtd-today':    { title: 'Today' },
    'gtd-week':     { title: 'This Week' },
    'gtd-paused':   { title: 'On Hold' },
    'gtd-sometime': { title: 'Someday' }
};

// --- Module-level State ---
let state = {
    tasks: [],
    activeModalTaskId: null,
    composerTargetColumn: null,
};
let dashboardAPI;
let appRootElement;
let isInitialized = false;

// --- State Management ---
function saveState() {
    dashboardAPI.saveData(APP_ID, 'tasks', { tasks: state.tasks });
}

// --- DOM Rendering ---
function render() {
    const columnsContainer = appRootElement.querySelector('.gtd-board-columns');
    columnsContainer.innerHTML = '';
    const taskCounts = {};

    Object.keys(COLUMNS).forEach(columnId => {
        taskCounts[columnId] = 0;
        const columnEl = document.createElement('div');
        columnEl.className = 'gtd-column';
        columnEl.innerHTML = `<header class="gtd-column-header"><h3>${COLUMNS[columnId].title}</h3><span id="${columnId}-count" class="gtd-task-count">0</span></header><ul class="task-list" id="${columnId}"></ul><footer class="column-footer"><button class="add-task-btn">+ Add a task</button></footer>`;
        columnsContainer.appendChild(columnEl);
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    state.tasks.forEach(task => {
        const column = appRootElement.querySelector(`#${task.column}`);
        if (!column) return;
        taskCounts[task.column]++;
        const card = document.createElement('li');
        card.className = 'task-card';
        card.draggable = true;
        card.dataset.taskId = task.id;

        if (task.category && CATEGORIES[task.category]) {
            const categoryPill = document.createElement('div');
            categoryPill.className = `category-pill category--${task.category}`;
            categoryPill.textContent = CATEGORIES[task.category].label;
            card.appendChild(categoryPill);
        }

        const content = document.createElement('div');
        content.className = 'task-card-content';
        content.textContent = task.text;
        card.appendChild(content);

        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            const badge = document.createElement('div');
            badge.className = 'due-date-badge';
            const dueDateNormalized = new Date(dueDate.getTime());
            dueDateNormalized.setUTCHours(0, 0, 0, 0);
            if (dueDateNormalized < today) badge.classList.add('due-date-badge--overdue');
            else if (dueDateNormalized.getTime() === today.getTime()) badge.classList.add('due-date-badge--today');
            badge.textContent = dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
            card.appendChild(badge);
        }

        if (task.subtasks && task.subtasks.length > 0) {
            const completed = task.subtasks.filter(st => st.isCompleted).length;
            const total = task.subtasks.length;
            const progress = (total > 0) ? (completed / total) * 100 : 0;
            const progressEl = document.createElement('div');
            progressEl.className = 'subtask-progress';
            progressEl.innerHTML = `
                <div class="subtask-progress-bar-container">
                    <div class="subtask-progress-bar" style="width: ${progress}%"></div>
                </div>
                <span class="subtask-progress-text">${completed}/${total}</span>`;
            card.appendChild(progressEl);
        }

        column.appendChild(card);
    });

    Object.keys(taskCounts).forEach(columnId => {
        const countElement = appRootElement.querySelector(`#${columnId}-count`);
        if (countElement) countElement.textContent = taskCounts[columnId];
    });
}

function renderSubtasks() {
    const task = state.tasks.find(t => t.id === state.activeModalTaskId);
    if (!task) return;
    const container = appRootElement.querySelector('#gtd-subtask-container .gtd-subtask-list');
    container.innerHTML = '';
    task.subtasks.forEach(subtask => {
        const item = document.createElement('li');
        item.className = `gtd-subtask-item ${subtask.isCompleted ? 'completed' : ''}`;
        item.dataset.subtaskId = subtask.id;
        item.innerHTML = `
            <input type="checkbox" ${subtask.isCompleted ? 'checked' : ''}>
            <span class="gtd-subtask-text">${subtask.text}</span>
            <input type="date" class="gtd-subtask-duedate" value="${subtask.dueDate || ''}">
            <button class="gtd-subtask-delete-btn">&times;</button>`;
        container.appendChild(item);
    });
}

// --- Modal Functions ---
function openTaskDetailModal(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;
    state.activeModalTaskId = taskId;
    const modal = appRootElement.querySelector('#gtd-task-modal');
    modal.querySelector('#gtd-modal-title').textContent = task.text;
    modal.querySelector('#gtd-modal-notes').value = task.notes || '';
    modal.querySelector('#gtd-modal-duedate').value = task.dueDate || '';
    const categorySelector = modal.querySelector('#gtd-category-selector');
    categorySelector.innerHTML = '';
    Object.keys(CATEGORIES).forEach(key => {
        const option = document.createElement('div');
        option.className = 'gtd-category-option';
        option.dataset.category = key;
        option.textContent = CATEGORIES[key].label;
        if (task.category === key) option.classList.add('active');
        categorySelector.appendChild(option);
    });
    renderSubtasks();
    modal.classList.add('visible');
}

function closeTaskDetailModal() {
    state.activeModalTaskId = null;
    appRootElement.querySelector('#gtd-task-modal').classList.remove('visible');
}

function openTaskComposer(columnId) {
    state.composerTargetColumn = columnId;
    const modal = appRootElement.querySelector('#gtd-composer-modal');
    modal.querySelector('#gtd-composer-task-name').value = '';
    modal.querySelector('#gtd-composer-duedate').value = '';
    modal.querySelector('#gtd-composer-duedate').classList.remove('visible');
    appRootElement.querySelector('#gtd-composer-date-btn').classList.remove('active');
    appRootElement.querySelector('#gtd-composer-category-btn').classList.remove('active');
    const categorySelector = modal.querySelector('#gtd-composer-category-selector');
    categorySelector.innerHTML = '';
    categorySelector.classList.remove('visible');
    Object.keys(CATEGORIES).forEach(key => {
        const option = document.createElement('div');
        option.className = 'gtd-category-option';
        option.dataset.category = key;
        option.textContent = CATEGORIES[key].label;
        categorySelector.appendChild(option);
    });
    modal.querySelector('#gtd-composer-add-btn').disabled = true;
    modal.classList.add('visible');
    modal.querySelector('#gtd-composer-task-name').focus();
}

function closeTaskComposer() {
    state.composerTargetColumn = null;
    appRootElement.querySelector('#gtd-composer-modal').classList.remove('visible');
}

// --- Event Handlers ---
function handleNoteUpdate(e) { const task = state.tasks.find(t => t.id === state.activeModalTaskId); if (task) { task.notes = e.target.value; saveState(); } }
function handleDueDateUpdate(e) { const task = state.tasks.find(t => t.id === state.activeModalTaskId); if (task) { task.dueDate = e.target.value; saveState(); render(); } }
function handleCategoryUpdate(e) { const categoryOption = e.target.closest('.gtd-category-option'); if (!categoryOption || !state.activeModalTaskId) return; const task = state.tasks.find(t => t.id === state.activeModalTaskId); if (!task) return; const newCategory = categoryOption.dataset.category; task.category = task.category === newCategory ? null : newCategory; saveState(); render(); const selector = appRootElement.querySelector('#gtd-task-modal #gtd-category-selector'); selector.querySelectorAll('.gtd-category-option').forEach(opt => opt.classList.remove('active')); if (task.category) { selector.querySelector(`[data-category="${task.category}"]`).classList.add('active'); } }
function handleAddTaskFromComposer() { if (!state.composerTargetColumn) return; const modal = appRootElement.querySelector('#gtd-composer-modal'); const text = modal.querySelector('#gtd-composer-task-name').value.trim(); if (!text) return; const dueDate = modal.querySelector('#gtd-composer-duedate').value || null; const activeCategory = modal.querySelector('#gtd-composer-category-selector .active'); const category = activeCategory ? activeCategory.dataset.category : null; state.tasks.push({ id: `task-${Date.now()}`, text, column: state.composerTargetColumn, notes: '', dueDate, category, subtasks: [] }); saveState(); render(); closeTaskComposer(); }
function handleComposerInput(e) { appRootElement.querySelector('#gtd-composer-add-btn').disabled = e.target.value.trim().length === 0; }
function handleDragAndDrop(e) { const card = e.target.closest('.task-card'); if (!card) return; if (e.type === 'dragstart') { e.dataTransfer.setData('text/plain', card.dataset.taskId); setTimeout(() => card.classList.add('is-dragging'), 0); } else if (e.type === 'dragend') { card.classList.remove('is-dragging'); } }
function handleDrop(e) { e.preventDefault(); const dropZone = e.target.closest('.task-list'); if (!dropZone) return; const taskId = e.dataTransfer.getData('text/plain'); const task = state.tasks.find(t => t.id === taskId); if (task && task.column !== dropZone.id) { task.column = dropZone.id; saveState(); render(); } }
function handleAddSubtask(form) { const task = state.tasks.find(t => t.id === state.activeModalTaskId); const input = form.querySelector('input[type="text"]'); if (!task || !input.value.trim()) return; task.subtasks.push({ id: `subtask-${Date.now()}`, text: input.value.trim(), isCompleted: false, dueDate: null }); input.value = ''; saveState(); renderSubtasks(); render(); }
function handleSubtaskInteraction(e) { const subtaskEl = e.target.closest('.gtd-subtask-item'); if (!subtaskEl) return; const task = state.tasks.find(t => t.id === state.activeModalTaskId); const subtask = task.subtasks.find(st => st.id === subtaskEl.dataset.subtaskId); if (!subtask) return; if (e.target.matches('input[type="checkbox"]')) { subtask.isCompleted = e.target.checked; } else if (e.target.matches('.gtd-subtask-delete-btn')) { task.subtasks = task.subtasks.filter(st => st.id !== subtask.id); } else if (e.target.matches('input[type="date"]')) { subtask.dueDate = e.target.value || null; } else { return; } saveState(); renderSubtasks(); render(); }

// --- Event Listener Setup ---
function addEventListeners() {
    if (isInitialized) return;
    appRootElement.addEventListener('click', (e) => {
        const addTaskBtn = e.target.closest('.add-task-btn');
        if (addTaskBtn) { const columnId = addTaskBtn.closest('.gtd-column').querySelector('.task-list').id; openTaskComposer(columnId); return; }
        const taskCard = e.target.closest('.task-card');
        if (taskCard) { openTaskDetailModal(taskCard.dataset.taskId); return; }
        const detailModal = e.target.closest('#gtd-task-modal');
        if (detailModal) { if (e.target.closest('.gtd-modal-close-btn') || e.target === detailModal) { closeTaskDetailModal(); } else if (e.target.closest('.gtd-category-option')) { handleCategoryUpdate(e); } return; }
        const composerModal = e.target.closest('#gtd-composer-modal');
        if (composerModal) {
            if (e.target.closest('.gtd-modal-close-btn') || e.target === composerModal) { closeTaskComposer(); }
            else if (e.target.closest('#gtd-composer-date-btn')) { const dateBtn = e.target.closest('#gtd-composer-date-btn'); const categoryBtn = composerModal.querySelector('#gtd-composer-category-btn'); const datePicker = composerModal.querySelector('#gtd-composer-duedate'); const categoryPicker = composerModal.querySelector('#gtd-composer-category-selector'); const isBecomingActive = dateBtn.classList.toggle('active'); datePicker.classList.toggle('visible', isBecomingActive); categoryBtn.classList.remove('active'); categoryPicker.classList.remove('visible'); }
            else if (e.target.closest('#gtd-composer-category-btn')) { const categoryBtn = e.target.closest('#gtd-composer-category-btn'); const dateBtn = composerModal.querySelector('#gtd-composer-date-btn'); const categoryPicker = composerModal.querySelector('#gtd-composer-category-selector'); const datePicker = composerModal.querySelector('#gtd-composer-duedate'); const isBecomingActive = categoryBtn.classList.toggle('active'); categoryPicker.classList.toggle('visible', isBecomingActive); dateBtn.classList.remove('active'); datePicker.classList.remove('visible'); }
            else if (e.target.closest('#gtd-composer-add-btn')) { handleAddTaskFromComposer(); }
            else if (e.target.closest('.gtd-category-option')) { const target = e.target.closest('.gtd-category-option'); const currentlyActive = target.parentElement.querySelector('.active'); if (currentlyActive) currentlyActive.classList.remove('active'); if (currentlyActive !== target) target.classList.add('active'); }
            return;
        }
    });
    appRootElement.addEventListener('input', (e) => { if (e.target.matches('#gtd-modal-notes')) handleNoteUpdate(e); if (e.target.matches('#gtd-composer-task-name')) handleComposerInput(e); });
    appRootElement.addEventListener('change', (e) => { if (e.target.matches('#gtd-modal-duedate')) handleDueDateUpdate(e); });
    appRootElement.addEventListener('dragstart', handleDragAndDrop);
    appRootElement.addEventListener('dragend', handleDragAndDrop);
    appRootElement.addEventListener('dragover', e => e.preventDefault());
    appRootElement.addEventListener('drop', handleDrop);
    const detailModal = appRootElement.querySelector('#gtd-task-modal');
    detailModal.querySelector('.gtd-add-subtask-form').addEventListener('submit', e => { e.preventDefault(); handleAddSubtask(e.target); });
    detailModal.querySelector('.gtd-subtask-list').addEventListener('click', handleSubtaskInteraction);
    detailModal.querySelector('.gtd-subtask-list').addEventListener('change', handleSubtaskInteraction);
    isInitialized = true;
}

// --- App Initializer ---
export function init(api, rootElement) {
    console.log("GTD Board App Final (Sub-tasks & Auto-Sort) initialized.");
    dashboardAPI = api;
    appRootElement = rootElement;

    const savedState = dashboardAPI.loadData(APP_ID, 'tasks');
    if (savedState && savedState.tasks) {
        state.tasks = savedState.tasks.map(task => ({ ...task, notes: task.notes || '', dueDate: task.dueDate || null, category: task.category || null, subtasks: task.subtasks || [] }));
    } else {
        const initialTodos = dashboardAPI.getActiveTodos() || [];
        state.tasks = initialTodos.map(todo => ({ id: `task-${Date.now()}-${Math.random()}`, text: todo.text, column: 'gtd-today', notes: '', dueDate: null, category: null, subtasks: [] }));
    }

    const todayString = new Date().toISOString().split('T')[0];
    let wasChanged = false;
    state.tasks.forEach(task => {
        if (task.dueDate === todayString && task.column !== 'gtd-today') {
            task.column = 'gtd-today';
            wasChanged = true;
        }
    });
    if (wasChanged) saveState();
    
    render();
    addEventListeners();
}