document.addEventListener('DOMContentLoaded', () => {
    let activeSubtaskForm = null;
    let totalDurationForProgress = 0;
    
    const state = {
        todos: { vormittag: [], nachmittag: [] },
        routine: [
            { id: 'r1', text: 'Morgenmeditation', completed: false },
            { id: 'r2', text: 'Tagesziele überprüfen', completed: false },
            { id: 'r3', text: 'Schreibtisch aufräumen', completed: false },
            { id: 'r4', text: 'Feierabend-Reflexion', completed: false }
        ],
        plannerEvents: [],
        totalTimeWorked: 0,
        timer: { interval: null, secondsLeft: 1500, isRunning: false, activeTaskItem: null }
    };

    const lists = {
        vormittag: document.getElementById('list-vormittag'),
        nachmittag: document.getElementById('list-nachmittag'),
        completedVormittag: document.getElementById('completed-list-vormittag'),
        completedNachmittag: document.getElementById('completed-list-nachmittag')
    };
    const dividers = {
        vormittag: document.getElementById('divider-vormittag'),
        nachmittag: document.getElementById('divider-nachmittag')
    };
    const forms = document.querySelectorAll('.add-todo-form');
    const modals = {
        focusFm: document.getElementById('modal-focus-fm'),
        routine: document.getElementById('modal-routine'),
        focusSession: document.getElementById('modal-focus-session'),
        planner: document.getElementById('modal-planner')
    };
    const modalButtons = {
        focusFm: document.getElementById('focus-fm-btn'),
        routine: document.getElementById('routine-btn'),
        focusSession: document.getElementById('focus-session-btn'),
        planner: document.getElementById('planner-btn')
    };
    const timerDisplay = document.getElementById('timer-display');
    const globalTimerDisplay = document.getElementById('global-timer-display');
    const timerControlButton = document.getElementById('timer-control-btn');
    const timerCancelButton = document.getElementById('timer-cancel-btn');
    const newDayButton = document.getElementById('new-day-btn');
    const dailyProgressBar = document.getElementById('daily-progress-bar');
    const routineListElement = document.getElementById('routine-list');
    const greetingElement = document.getElementById('greeting');
    const progressTimeDisplay = document.getElementById('progress-time');
    const startNextTaskBtn = document.getElementById('start-next-task-btn');
    const globalStartNextBtn = document.getElementById('global-start-next-btn');
    const headerProgressBar = document.getElementById('header-progress-bar');
    const plannerTimeline = document.querySelector('.planner-timeline');
    const plannerGrid = document.querySelector('.planner-grid');
    const plannerInputModal = document.getElementById('planner-input-modal');
    const plannerInputText = document.getElementById('planner-input-text');
    const plannerInputSave = document.getElementById('planner-input-save');
    const categorySelector = document.querySelector('.category-selector');
    const timerProgressBand = document.getElementById('timer-progress-band');
    
    let audioCtx;

    function init() {
        setGreeting();
        loadState();
        renderAll();
        addEventListeners();
        updateDailyProgress();
        updateFocusSessionView();
        updateGlobalControlsView();
        renderPlannerTimeline();
    }

    function setGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) greetingElement.textContent = 'Guten Morgen';
        else if (hour < 18) greetingElement.textContent = 'Guten Tag';
        else greetingElement.textContent = 'Guten Abend';
    }

    function loadState() {
        const savedState = JSON.parse(localStorage.getItem('focusDashboardState'));
        if (savedState) {
            Object.assign(state, savedState);
        }
    }

    function saveState() {
        localStorage.setItem('focusDashboardState', JSON.stringify(state));
    }

    function renderAll() {
        renderTodoList('vormittag');
        renderTodoList('nachmittag');
        renderRoutineList();
        renderPlannerEvents();
    }

    function renderTodoList(listName) {
        lists[listName].innerHTML = '';
        lists['completed' + capitalize(listName)].innerHTML = '';
        const activeTasks = state.todos[listName].filter(t => !t.completed);
        const completedTasks = state.todos[listName].filter(t => t.completed);
        activeTasks.forEach(todo => lists[listName].appendChild(createTaskElement(todo, listName)));
        completedTasks.forEach(todo => lists['completed' + capitalize(listName)].appendChild(createTaskElement(todo, listName)));
        dividers[listName].style.display = completedTasks.length > 0 ? 'block' : 'none';
    }

    function createTaskElement(todo, listName) {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.dataset.id = todo.id;
        li.dataset.list = listName;
        li.innerHTML = `
            <div class="todo-item-main">
                <input type="checkbox" ${todo.completed ? 'checked' : ''}>
                <span class="task-content">${todo.text}</span>
                <div class="task-actions">
                    <button class="add-subtask-btn" title="Unteraufgabe hinzufügen"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg></button>
                    <button class="toggle-notes-btn" title="Notizen anzeigen/verbergen"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg></button>
                    <button class="delete-btn" title="Löschen"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                    <button class="task-timer-btn" title="Timer starten">▶</button>
                </div>
                <span class="task-time">${todo.time} min</span>
            </div>
            <textarea class="notes-area">${todo.notes || ''}</textarea>
            <ul class="subtask-list"></ul>
            <form class="add-subtask-form"><input type="text" placeholder="Neue Unteraufgabe..." required><button type="submit">+</button></form>`;
        renderSubtasks(li, todo);
        return li;
    }

    function renderSubtasks(parentLi, todo) {
        const subtaskList = parentLi.querySelector('.subtask-list');
        subtaskList.innerHTML = '';
        if (!todo.subtasks) todo.subtasks = [];
        todo.subtasks.forEach((subtask, index) => {
            const subtaskLi = document.createElement('li');
            subtaskLi.className = `subtask-item ${subtask.completed ? 'completed' : ''}`;
            subtaskLi.innerHTML = `<input type="checkbox" data-index="${index}" ${subtask.completed ? 'checked' : ''}><span>${subtask.text}</span><button class="delete-subtask-btn" data-index="${index}">&times;</button>`;
            subtaskList.appendChild(subtaskLi);
        });
    }

    function renderRoutineList() {
        routineListElement.innerHTML = '';
        state.routine.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<input type="checkbox" id="${item.id}" ${item.completed ? 'checked' : ''}><label for="${item.id}">${item.text}</label>`;
            routineListElement.appendChild(li);
        });
    }

    function addEventListeners() {
        forms.forEach(form => form.addEventListener('submit', handleAddTodo));
        document.body.addEventListener('click', handleBodyClick);
        document.body.addEventListener('change', handleCheckboxChange);
        document.body.addEventListener('blur', handleNotesBlur, true);
        document.body.addEventListener('submit', handleSubtaskSubmit);
        document.addEventListener('click', (e) => {
            if (activeSubtaskForm && !activeSubtaskForm.closest('.todo-item').contains(e.target)) {
                activeSubtaskForm.style.display = 'none';
                activeSubtaskForm = null;
            }
        });
        Object.keys(modalButtons).forEach(key => modalButtons[key].addEventListener('click', () => toggleModal(modals[key], true)));
        Object.values(modals).forEach(modal => modal.addEventListener('click', e => {
            if (e.target === modal || e.target.classList.contains('modal-close-btn')) toggleModal(modal, false);
        }));
        timerControlButton.addEventListener('click', togglePauseTimer);
        timerCancelButton.addEventListener('click', cancelTimer);
        newDayButton.addEventListener('click', handleNewDay);
        startNextTaskBtn.addEventListener('click', startNextTask);
        globalStartNextBtn.addEventListener('click', startNextTask);
        plannerGrid.addEventListener('mousedown', handlePlannerInteraction);
        categorySelector.addEventListener('click', (e) => {
            if(e.target.classList.contains('category-btn')) {
                categorySelector.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
            }
        });
    }

    function handleAddTodo(e) {
        e.preventDefault();
        const form = e.target;
        const listName = form.dataset.list;
        const textInput = form.querySelector('input[type="text"]');
        const timeInput = form.querySelector('input[type="number"]');
        const newTodo = { id: 'todo_' + Date.now().toString(), text: textInput.value, time: parseInt(timeInput.value, 10), completed: false, notes: '', subtasks: [] };
        
        const { startHour, startMinutes } = findNextAvailableSlot(newTodo.time);
        const newPlannerEvent = {
            id: 'event_' + Date.now().toString(),
            todoId: newTodo.id,
            text: newTodo.text,
            startHour: startHour,
            startMinutes: startMinutes,
            durationMinutes: newTodo.time,
            category: 'deepwork' // Standardkategorie
        };
        state.plannerEvents.push(newPlannerEvent);
        
        state.todos[listName].push(newTodo);
        
        sortTodosBasedOnPlanner();
        saveState();
        renderAll();
        form.reset();
        updateDailyProgress();
    }

    function handleBodyClick(e) {
        const target = e.target;
        const todoItem = target.closest('.todo-item');
        if (!todoItem) return;
        const id = todoItem.dataset.id;
        const listName = todoItem.dataset.list;
        const todo = findTodoById(id, listName);
        
        if (target.closest('.delete-btn')) {
            deletePlannerEventAndTodoByTodoId(id);
        } else if (target.closest('.toggle-notes-btn')) {
            const notesArea = todoItem.querySelector('.notes-area');
            notesArea.style.display = notesArea.style.display === 'none' ? 'block' : 'none';
            if (notesArea.style.display === 'block') notesArea.focus();
        } else if (target.closest('.add-subtask-btn')) {
            const subtaskForm = todoItem.querySelector('.add-subtask-form');
            if (activeSubtaskForm && activeSubtaskForm !== subtaskForm) activeSubtaskForm.style.display = 'none';
            const isVisible = subtaskForm.style.display === 'flex';
            subtaskForm.style.display = isVisible ? 'none' : 'flex';
            if (!isVisible) {
                activeSubtaskForm = subtaskForm;
                subtaskForm.querySelector('input').focus();
            } else {
                activeSubtaskForm = null;
            }
        } else if (target.closest('.task-timer-btn')) {
            startTimer(todo.time * 60, todoItem);
        } else if (target.closest('.delete-subtask-btn')) {
            const index = parseInt(target.closest('.delete-subtask-btn').dataset.index, 10);
            todo.subtasks.splice(index, 1);
            saveState();
            renderSubtasks(todoItem, todo);
        }
    }

    function handleCheckboxChange(e) {
        const target = e.target;
        if (target.type !== 'checkbox') return;
        const subtaskItem = target.closest('.subtask-item');
        if (subtaskItem) {
            const parentTodoItem = subtaskItem.closest('.todo-item');
            const id = parentTodoItem.dataset.id;
            const listName = parentTodoItem.dataset.list;
            const todo = findTodoById(id, listName);
            const index = parseInt(target.dataset.index, 10);
            todo.subtasks[index].completed = target.checked;
            saveState();
            renderSubtasks(parentTodoItem, todo);
            return;
        }
        const todoItem = target.closest('.todo-item');
        if (todoItem) {
            if (target.parentElement.classList.contains('todo-item-main')) {
                const id = todoItem.dataset.id;
                const listName = todoItem.dataset.list;
                const todo = findTodoById(id, listName);
                todo.completed = target.checked;
                if (target.checked) {
                    playSound();
                    state.totalTimeWorked += todo.time;
                } else {
                    state.totalTimeWorked -= todo.time;
                }
                saveAndRerender(listName);
                updateDailyProgress();
                return;
            }
        }
        const routineItem = target.closest('#routine-list li');
        if (routineItem) {
            const routine = state.routine.find(r => r.id === target.id);
            routine.completed = target.checked;
            saveState();
        }
    }

    function handleNotesBlur(e) {
        if (e.target.classList.contains('notes-area')) {
            const todoItem = e.target.closest('.todo-item');
            const id = todoItem.dataset.id;
            const listName = todoItem.dataset.list;
            const todo = findTodoById(id, listName);
            todo.notes = e.target.value;
            saveState();
        }
    }

    function handleSubtaskSubmit(e) {
        if (e.target.classList.contains('add-subtask-form')) {
            e.preventDefault();
            const form = e.target;
            const input = form.querySelector('input');
            const parentTodoItem = form.closest('.todo-item');
            const id = parentTodoItem.dataset.id;
            const listName = parentTodoItem.dataset.list;
            const todo = findTodoById(id, listName);
            todo.subtasks.push({ text: input.value, completed: false });
            saveState();
            renderSubtasks(parentTodoItem, todo);
            form.reset();
        }
    }

    function handleNewDay() {
        localStorage.clear();
        location.reload();
    }

    function startNextTask() {
        let nextTodo = state.todos.vormittag.find(t => !t.completed) || state.todos.nachmittag.find(t => !t.completed);
        if (nextTodo) {
            const todoItemElement = document.querySelector(`.todo-item[data-id='${nextTodo.id}']`);
            if (todoItemElement) startTimer(nextTodo.time * 60, todoItemElement);
        } else {
            startNextTaskBtn.textContent = 'Alle Aufgaben erledigt!';
            globalStartNextBtn.textContent = 'Fertig!';
            setTimeout(() => { 
                startNextTaskBtn.textContent = 'Nächste Aufgabe starten';
                globalStartNextBtn.textContent = '▶ Nächste';
            }, 2000);
        }
    }

    function updateFocusSessionView() {
        const timerIsActive = state.timer.isRunning || state.timer.interval;
        timerDisplay.style.display = timerIsActive ? 'block' : 'none';
        startNextTaskBtn.style.display = timerIsActive ? 'none' : 'block';
        document.querySelector('.timer-controls').style.display = timerIsActive ? 'flex' : 'none';
    }

    function updateGlobalControlsView() {
        const timerIsActive = state.timer.isRunning || state.timer.interval;

