export async function init(api, appRootElement) {

    // --- STATE MANAGEMENT & CONFIG ---
    const columns = {
        inbox: "📥 Eingang", today: "🎯 Heute", week: "🗓️ Diese Woche",
        paused: "⏸️ Pausiert / Delegiert", someday: "🤔 Vielleicht / Irgendwann"
    };

    const labelConfig = {
        'Focus': 'label-focus', 'Meeting': 'label-meeting', 'Privat': 'label-privat',
        'Organisation': 'label-organisation'
    };

    const getTodayISO = () => new Date().toLocaleDateString('en-CA');

    const getInitialTasks = async () => {
        const savedTasks = await api.loadData('gtd-board', 'tasks');
        if (savedTasks && Object.keys(savedTasks).length > 0) return savedTasks;
        
        // Return default tasks if storage is empty
        return {
            inbox: [{ id: `task-${Date.now() + 1}`, content: 'Wöchentliches Team-Sync planen', dueDate: null, label: 'Meeting', subtasks: [], notes: "" }],
            today: [
                { id: `task-${Date.now() + 2}`, content: 'Präsentation fertigstellen', dueDate: getTodayISO(), label: 'Focus', subtasks: [{text: 'Feedback einarbeiten', done: true}, {text: 'Zahlen prüfen', done: false}], notes: "Final check required." },
                { id: `task-${Date.now() + 3}`, content: 'Arzttermin vereinbaren', dueDate: getTodayISO(), label: 'Privat', subtasks: [], notes: "" },
            ],
            week: [{ id: `task-${Date.now() + 6}`, content: 'Reise buchen', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA'), label: 'Organisation', subtasks: [], notes: "" }],
            paused: [],
            someday: [{ id: `task-${Date.now() + 5}`, content: 'Neues Hobby lernen', dueDate: null, label: 'Privat', subtasks: [], notes: "" }]
        };
    };
    
    let tasks = await getInitialTasks();
    const saveTasks = () => api.saveData('gtd-board', 'tasks', tasks);
    
    // --- CORE LOGIC ---
    const autoSortTasksByDate = () => {
        const today = getTodayISO();
        let tasksMoved = false;
        Object.keys(tasks).forEach(columnId => {
            if (columnId === 'today') return;
            const tasksToMove = [];
            tasks[columnId] = tasks[columnId].filter(task => {
                if (task.dueDate === today) {
                    tasksToMove.push(task);
                    return false;
                }
                return true;
            });
            if (tasksToMove.length > 0) {
                tasks.today = [...tasks.today, ...tasksToMove];
                tasksMoved = true;
            }
        });
        if (tasksMoved) console.log("GTD Board: Tasks automatically moved to 'Today' column.");
    };

    // --- RENDERING ---
    const board = appRootElement.querySelector('#gtd-board');
    const modalContainer = appRootElement.querySelector('#modal-container');

    const renderBoard = () => {
        board.innerHTML = ''; 
        for (const columnId in columns) {
            const columnEl = document.createElement('div');
            columnEl.className = 'gtd-column';
            columnEl.dataset.columnId = columnId;
            columnEl.innerHTML = `
                <div class="gtd-column-header">
                    <h2>${columns[columnId]}</h2>
                    <span>${tasks[columnId]?.length || 0}</span>
                </div>
                <div class="gtd-tasks-container" data-role="tasks-container"></div>
            `;
            const tasksContainerEl = columnEl.querySelector('[data-role="tasks-container"]');
            tasks[columnId]?.forEach(task => tasksContainerEl.appendChild(createTaskElement(task)));
            
            if (columnId === 'inbox') {
                columnEl.appendChild(createAddTaskForm());
            }
            board.appendChild(columnEl);
        }
        addEventListeners();
    };
    
    const createTaskElement = (task) => {
        const taskEl = document.createElement('div');
        taskEl.className = 'gtd-task-card';
        taskEl.dataset.taskId = task.id;
        taskEl.draggable = true;

        let labelHtml = '';
        if (task.label && labelConfig[task.label]) {
            labelHtml = `<span class="label-tag ${labelConfig[task.label]}">${task.label}</span>`;
        }

        let dueDateHtml = '';
        if (task.dueDate) {
            const today = getTodayISO();
            const isOverdue = task.dueDate < today;
            const isToday = task.dueDate === today;
            let colorClass = '';
            if (isToday) colorClass = 'due-today';
            if (isOverdue) colorClass = 'due-overdue';
            const formattedDate = new Date(task.dueDate).toLocaleDateString('de-DE', { month: 'short', day: 'numeric' });
            dueDateHtml = `<span class="card-meta-item ${colorClass}">
                <svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path></svg>
                ${isToday ? 'Heute' : formattedDate}</span>`;
        }

        let subtasksHtml = '';
        if (task.subtasks?.length > 0) {
            const doneCount = task.subtasks.filter(st => st.done).length;
            subtasksHtml = `<span class="card-meta-item">
               <svg fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"></path></svg>
               ${doneCount}/${task.subtasks.length}</span>`;
        }
        
        let notesHtml = '';
        if (task.notes?.trim()) {
            notesHtml = `<span class="card-meta-item" title="Notiz vorhanden"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path></svg></span>`;
        }

        taskEl.innerHTML = `
            <div class="card-header"><p>${task.content}</p>${labelHtml}</div>
            <div class="card-footer"><div class="card-meta">${dueDateHtml}${subtasksHtml}</div>${notesHtml}</div>
            <div class="actions">
                <button data-action="delete" title="Delete Task"><svg viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
            </div>`;
        return taskEl;
    };

    const createAddTaskForm = () => {
        const formContainer = document.createElement('div');
        formContainer.className = 'add-task-container';
        
        const columnOptions = Object.keys(columns).map(columnId => `<option value="${columnId}">${columns[columnId].substring(2).trim()}</option>`).join('');
        const labelOptions = Object.keys(labelConfig).map(label => `<option value="${label}">${label}</option>`).join('');

        formContainer.innerHTML = `
            <form id="add-task-form">
                <input type="text" name="task-content" placeholder="Neue Aufgabe..." required class="gtd-form-input">
                <select name="task-column" class="gtd-form-select">${columnOptions}</select>
                <select name="task-label" class="gtd-form-select"><option value="">Label auswählen...</option>${labelOptions}</select>
                <div class="add-task-bottom-row">
                    <input type="date" name="task-due-date" class="gtd-form-input" style="margin-bottom: 0;">
                    <button type="submit" class="add-task-btn" title="Add Task"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg></button>
                </div>
            </form>`;
        return formContainer;
    };

    // --- EVENT HANDLING & ACTIONS ---
    const addEventListeners = () => {
        appRootElement.querySelector('#add-task-form')?.addEventListener('submit', handleAddTask);
        
        board.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="delete"]')) handleDeleteTask(e);
            else if (e.target.closest('[data-task-id]')) openEditModal(e);
        });

        board.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) { e.preventDefault(); board.scrollLeft += e.deltaY; }
        });

        appRootElement.querySelectorAll('[draggable="true"]').forEach(d => {
            d.addEventListener('dragstart', handleDragStart);
            d.addEventListener('dragend', handleDragEnd);
        });

        appRootElement.querySelectorAll('[data-role="tasks-container"]').forEach(c => {
            c.addEventListener('dragover', handleDragOver);
            c.addEventListener('dragleave', handleDragLeave);
            c.addEventListener('drop', handleDrop);
        });
    };

    const handleAddTask = (e) => {
        e.preventDefault();
        const form = e.target;
        const content = form.elements['task-content'].value.trim();
        if (!content) return;

        const newTask = {
            id: `task-${Date.now()}`, content: content,
            dueDate: form.elements['task-due-date'].value || null,
            label: form.elements['task-label'].value || null,
            subtasks: [], notes: ""
        };

        const targetColumn = form.elements['task-column'].value;
        tasks[targetColumn].unshift(newTask);
        saveTasks();
        autoSortTasksByDate();
        renderBoard();
    };
    
    const handleDeleteTask = (e) => {
        const taskId = e.target.closest('[data-task-id]').dataset.taskId;
        for (const colId in tasks) tasks[colId] = tasks[colId].filter(t => t.id !== taskId);
        saveTasks();
        renderBoard();
    };

    // --- MODAL LOGIC ---
    const openEditModal = (e) => {
        const taskId = e.target.closest('[data-task-id]').dataset.taskId;
        let task;
        for (const colId in tasks) {
            const foundTask = tasks[colId].find(t => t.id === taskId);
            if (foundTask) { task = foundTask; break; }
        }
        if (!task) return;

        const labelOptions = Object.keys(labelConfig).map(label => `<option value="${label}" ${task.label === label ? 'selected' : ''}>${label}</option>`).join('');

        modalContainer.innerHTML = `
        <div class="modal-overlay" data-action="close-modal">
            <div class="modal-panel" onclick="event.stopPropagation();">
                <button data-action="close-modal" class="modal-close-btn">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <div class="modal-header"><h3 class="text-xl font-bold">${task.content}</h3></div>
                <div class="modal-body">
                    <div class="modal-grid">
                        <div>
                            <label for="modal-due-date">Fälligkeitsdatum</label>
                            <input type="date" id="modal-due-date" value="${task.dueDate || ''}" class="gtd-form-input">
                        </div>
                        <div>
                            <label for="modal-label">Label</label>
                            <select id="modal-label" class="gtd-form-select">
                                <option value="">Kein Label</option>${labelOptions}
                            </select>
                        </div>
                    </div>
                    <h4>Notizen</h4>
                    <textarea id="modal-notes" placeholder="Details zur Aufgabe...">${task.notes || ''}</textarea>
                    <h4>Unteraufgaben</h4>
                    <div id="modal-subtasks-list"></div>
                    <form id="add-subtask-form">
                        <input type="text" name="subtask-content" placeholder="Neue Unteraufgabe..." required class="gtd-form-input" style="margin-bottom: 0;">
                        <button type="submit" class="add-task-btn"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg></button>
                    </form>
                </div>
            </div>
        </div>`;
        
        const renderSubtasks = () => {
            const listEl = modalContainer.querySelector('#modal-subtasks-list');
            if (!listEl) return;
            listEl.innerHTML = '';
            (task.subtasks || []).forEach((subtask, index) => {
                listEl.innerHTML += `
                <div class="subtask-item">
                    <label class="${subtask.done ? 'subtask-done' : ''}">
                        <input type="checkbox" data-subtask-index="${index}" ${subtask.done ? 'checked' : ''}>
                        <span>${subtask.text}</span>
                    </label>
                    <button data-action="delete-subtask" data-subtask-index="${index}" class="subtask-delete-btn">&times;</button>
                </div>`;
            });
        }
        renderSubtasks();

        const updateTask = () => { saveTasks(); autoSortTasksByDate(); renderBoard(); };

        modalContainer.querySelector('#modal-due-date').addEventListener('change', (e) => { task.dueDate = e.target.value || null; updateTask(); });
        modalContainer.querySelector('#modal-label').addEventListener('change', (e) => { task.label = e.target.value || null; updateTask(); });
        modalContainer.querySelector('#modal-notes').addEventListener('blur', (e) => { task.notes = e.target.value; updateTask(); });
        modalContainer.querySelector('#add-subtask-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const input = e.target.elements['subtask-content'];
            if(input.value.trim()){
                if(!task.subtasks) task.subtasks = [];
                task.subtasks.push({ text: input.value.trim(), done: false });
                renderSubtasks(); updateTask();
                input.value = '';
            }
        });
        modalContainer.addEventListener('change', (e) => {
           if(e.target.matches('input[type=checkbox][data-subtask-index]')){
               const index = parseInt(e.target.dataset.subtaskIndex);
               task.subtasks[index].done = e.target.checked;
               renderSubtasks(); updateTask();
           }
        });
        modalContainer.addEventListener('click', (e) => {
           if(e.target.closest('[data-action="delete-subtask"]')){
               const index = parseInt(e.target.closest('[data-subtask-index]').dataset.subtaskIndex);
               task.subtasks.splice(index, 1);
               renderSubtasks(); updateTask();
           }
        });
    };
    
    modalContainer.addEventListener('click', (e) => {
        if(e.target.closest('[data-action="close-modal"]')) modalContainer.innerHTML = '';
    });

    // --- DRAG & DROP LOGIC ---
    let draggedItemId = null;
    const handleDragStart = e => { draggedItemId = e.target.dataset.taskId; e.target.classList.add('dragging'); };
    const handleDragEnd = e => {
        draggedItemId = null;
        e.target?.classList.remove('dragging');
        appRootElement.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    };
    const handleDragOver = e => { e.preventDefault(); e.target.closest('[data-role="tasks-container"]')?.classList.add('drag-over'); };
    const handleDragLeave = e => e.target.closest('[data-role="tasks-container"]')?.classList.remove('drag-over');
    const handleDrop = (e) => {
        e.preventDefault();
        const targetContainerEl = e.target.closest('[data-role="tasks-container"]');
        if (!targetContainerEl) return;
        const targetColumnId = targetContainerEl.parentElement.dataset.columnId;
        let draggedTask, sourceColumnId;
        for (const colId in tasks) {
            const task = tasks[colId].find(t => t.id === draggedItemId);
            if (task) { draggedTask = task; sourceColumnId = colId; break; }
        }
        if (draggedTask && sourceColumnId !== targetColumnId) {
            tasks[sourceColumnId] = tasks[sourceColumnId].filter(t => t.id !== draggedItemId);
            tasks[targetColumnId].push(draggedTask);
            saveTasks(); renderBoard();
        }
    };

    // --- INITIALIZE APP ---
    autoSortTasksByDate();
    renderBoard();
}