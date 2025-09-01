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
    const plannerBtn = document.getElementById('planner-btn');
    const plannerModal = document.getElementById('modal-planner');
    const plannerTimeline = document.querySelector('.planner-timeline');
    const plannerGrid = document.querySelector('.planner-grid');
    const plannerInputModal = document.getElementById('planner-input-modal');
    const plannerInputText = document.getElementById('planner-input-text');
    const plannerInputSave = document.getElementById('planner-input-save');
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
        renderPlannerEvents();
    }

    function setGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) greetingElement.textContent = 'Guten Morgen';
        else if (hour < 18) greetingElement.textContent = 'Guten Tag';
        else greetingElement.textContent = 'Guten Abend';
    }

    function loadState() {
        const savedTodos = JSON.parse(localStorage.getItem('focusDashboard_todos'));
        if (savedTodos) state.todos = savedTodos;
        const savedRoutine = JSON.parse(localStorage.getItem('focusDashboard_routine'));
        if (savedRoutine) state.routine = savedRoutine;
        const savedTime = localStorage.getItem('focusDashboard_timeWorked');
        if (savedTime) state.totalTimeWorked = parseInt(savedTime, 10);
        const savedPlannerEvents = JSON.parse(localStorage.getItem('focusDashboard_plannerEvents'));
        if (savedPlannerEvents) state.plannerEvents = savedPlannerEvents;
    }

    function saveState() {
        localStorage.setItem('focusDashboard_todos', JSON.stringify(state.todos));
        localStorage.setItem('focusDashboard_routine', JSON.stringify(state.routine));
        localStorage.setItem('focusDashboard_timeWorked', state.totalTimeWorked);
        localStorage.setItem('focusDashboard_plannerEvents', JSON.stringify(state.plannerEvents));
    }

    function renderAll() {
        renderTodoList('vormittag');
        renderTodoList('nachmittag');
        renderRoutineList();
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
    }

    function handleAddTodo(e) {
        e.preventDefault();
        const form = e.target;
        const listName = form.dataset.list;
        const textInput = form.querySelector('input[type="text"]');
        const timeInput = form.querySelector('input[type="number"]');
        const newTodo = { id: 'todo_' + Date.now().toString(), text: textInput.value, time: parseInt(timeInput.value, 10), completed: false, notes: '', subtasks: [] };
        
        // NEU: Synchronisation zum Planer
        const { startHour, startMinutes } = findNextAvailableSlot(newTodo.time);
        const newPlannerEvent = {
            id: 'event_' + Date.now().toString(),
            todoId: newTodo.id,
            text: newTodo.text,
            startHour: startHour,
            startMinutes: startMinutes,
            durationMinutes: newTodo.time
        };
        state.plannerEvents.push(newPlannerEvent);
        
        state.todos[listName].push(newTodo);
        
        sortTodosBasedOnPlanner();
        saveState();
        renderTodoList('vormittag');
        renderTodoList('nachmittag');
        renderPlannerEvents();
        
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
            const todoId = todoItem.dataset.id;
            deletePlannerEventAndTodoByTodoId(todoId);
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
        localStorage.removeItem('focusDashboard_todos');
        localStorage.removeItem('focusDashboard_routine');
        localStorage.removeItem('focusDashboard_timeWorked');
        localStorage.removeItem('focusDashboard_plannerEvents');
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
        const timerIsActive = state.timer.isRunning;
        timerDisplay.style.display = timerIsActive ? 'block' : 'none';
        startNextTaskBtn.style.display = timerIsActive ? 'none' : 'block';
        document.querySelector('.timer-controls').style.display = timerIsActive ? 'flex' : 'none';
    }

    function updateGlobalControlsView() {
        const timerIsActive = state.timer.isRunning;
        if (timerIsActive) {
            globalTimerDisplay.style.display = 'block';
            timerProgressBand.style.display = 'block';
            globalStartNextBtn.style.display = 'none';
        } else {
            globalTimerDisplay.style.display = 'none';
            timerProgressBand.style.display = 'none';
            globalStartNextBtn.style.display = 'block';
        }
    }

    function startTimer(duration, taskItem) {
        if (state.timer.isRunning) { return; }
        totalDurationForProgress = duration;
        timerProgressBand.style.background = 'conic-gradient(var(--accent-color) 360deg, transparent 360deg)';
        state.timer.secondsLeft = duration;
        state.timer.isRunning = true;
        state.timer.activeTaskItem = taskItem;
        state.timer.interval = setInterval(updateTimer, 1000);
        updateTimerUI();
        modalButtons.focusSession.classList.add('active');
        updateFocusSessionView();
        updateGlobalControlsView();
    }
    function updateTimer() {
        state.timer.secondsLeft--;
        updateTimerUI();
        
        const percentage = state.timer.secondsLeft / totalDurationForProgress;
        const angle = percentage * 360;
        timerProgressBand.style.background = `conic-gradient(var(--accent-color) ${angle}deg, transparent ${angle}deg)`;

        if (state.timer.secondsLeft < 0) {
            clearInterval(state.timer.interval);
            const checkbox = state.timer.activeTaskItem.querySelector('input[type="checkbox"]');
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            resetTimerState();
        }
    }
    function togglePauseTimer() {
        if (!state.timer.interval && !state.timer.isRunning) return;
        state.timer.isRunning = !state.timer.isRunning;
        if (state.timer.isRunning) {
            state.timer.interval = setInterval(updateTimer, 1000);
            timerControlButton.textContent = 'Pause';
            if(state.timer.activeTaskItem) state.timer.activeTaskItem.querySelector('.task-timer-btn').innerHTML = '⏸';
        } else {
            clearInterval(state.timer.interval);
            timerControlButton.textContent = 'Fortsetzen';
            if(state.timer.activeTaskItem) state.timer.activeTaskItem.querySelector('.task-timer-btn').innerHTML = '▶';
        }
    }
    function cancelTimer() {
        clearInterval(state.timer.interval);
        resetTimerState();
    }
    function resetTimerState() {
        state.timer.isRunning = false;
        state.timer.interval = null;
        state.timer.activeTaskItem = null;
        state.timer.secondsLeft = 1500;
        updateTimerUI();
        modalButtons.focusSession.classList.remove('active');
        document.querySelectorAll('.task-timer-btn').forEach(btn => {
            btn.disabled = false;
            btn.innerHTML = '▶';
        });
        document.title = 'Fokus Dashboard';
        updateFocusSessionView();
        updateGlobalControlsView();
    }
    function updateTimerUI() {
        const minutes = Math.floor(state.timer.secondsLeft / 60);
        const seconds = state.timer.secondsLeft % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        timerDisplay.textContent = display;
        globalTimerDisplay.textContent = display;
        document.title = `${display} - Fokus Dashboard`;
    }

    function formatMinutesToHours(minutes) {
        if (isNaN(minutes) || minutes === 0) return '0m';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        let result = '';
        if (h > 0) result += `${h}h `;
        if (m > 0) result += `${m}m`;
        return result.trim();
    }

    function updateDailyProgress() {
        const allTasks = [...state.todos.vormittag, ...state.todos.nachmittag];
        const totalTimeOfAllTasks = allTasks.reduce((sum, t) => sum + t.time, 0);
        const workedTime = state.totalTimeWorked;
        const workedTimeFormatted = formatMinutesToHours(workedTime);
        const totalTimeFormatted = formatMinutesToHours(totalTimeOfAllTasks);
        progressTimeDisplay.textContent = `${workedTimeFormatted} / ${totalTimeFormatted}`;
        if (totalTimeOfAllTasks === 0) {
            dailyProgressBar.style.width = '0%';
            headerProgressBar.style.width = '0%';
            return;
        }
        const percentage = (workedTime / totalTimeOfAllTasks) * 100;
        dailyProgressBar.style.width = `${Math.min(percentage, 100)}%`;
        headerProgressBar.style.width = `${Math.min(percentage, 100)}%`;
    }

    function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }
    function findTodoById(id, listName) { return state.todos[listName].find(t => t.id === id); }
    function saveAndRerender(listName) { 
        sortTodosBasedOnPlanner();
        saveState(); 
        renderTodoList('vormittag');
        renderTodoList('nachmittag');
    }
    function toggleModal(modal, show) { modal.classList.toggle('visible', show); }
    function playSound() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
        oscillator.stop(audioCtx.currentTime + 0.5);
    }

    const PLANNER_START_HOUR = 7;
    const HOUR_HEIGHT = 60;

    function renderPlannerTimeline() {
        plannerTimeline.innerHTML = '';
        for (let hour = PLANNER_START_HOUR; hour <= 21; hour++) {
            const timeSlot = document.createElement('div');
            timeSlot.textContent = `${hour}:00`;
            plannerTimeline.appendChild(timeSlot);
        }
    }

    function renderPlannerEvents() {
        plannerGrid.innerHTML = '';
        state.plannerEvents.forEach(event => {
            const eventEl = document.createElement('div');
            eventEl.className = 'planner-event';
            eventEl.dataset.id = event.id;
            eventEl.innerHTML = `<span class="planner-event-text">${event.text}</span><button class="planner-delete-btn">&times;</button><div class="planner-event-resize-handle"></div>`;
            eventEl.style.top = `${(event.startHour - PLANNER_START_HOUR) * HOUR_HEIGHT + (event.startMinutes || 0)}px`;
            eventEl.style.height = `${event.durationMinutes}px`;
            plannerGrid.appendChild(eventEl);
        });
    }

    let plannerAction = { active: false, type: null, target: null, initialY: 0, initialTop: 0, initialHeight: 0 };

    function handlePlannerInteraction(e) {
        if (e.button !== 0) return;
        const target = e.target;
        
        if (target.classList.contains('planner-delete-btn')) {
            const eventEl = e.target.closest('.planner-event');
            deletePlannerEventAndTodo(eventEl.dataset.id);
            e.stopPropagation();
            return;
        }

        plannerAction.active = true;
        plannerAction.initialY = e.clientY;

        if (target.classList.contains('planner-event')) {
            plannerAction.type = 'move';
            plannerAction.target = target;
            plannerAction.initialTop = target.offsetTop;
        } else if (target.classList.contains('planner-event-resize-handle')) {
            plannerAction.type = 'resize';
            plannerAction.target = target.parentElement;
            plannerAction.initialHeight = plannerAction.target.offsetHeight;
        } else if (target === plannerGrid) {
            plannerAction.type = 'create';
            const newEventEl = document.createElement('div');
            newEventEl.className = 'planner-event';
            const startTop = e.offsetY - (e.offsetY % 15);
            newEventEl.style.top = `${startTop}px`;
            newEventEl.style.height = '30px';
            plannerGrid.appendChild(newEventEl);
            plannerAction.target = newEventEl;
            plannerAction.initialTop = startTop;
        }

        document.addEventListener('mousemove', onPlannerMouseMove);
        document.addEventListener('mouseup', onPlannerMouseUp);
    }

    function onPlannerMouseMove(e) {
        if (!plannerAction.active) return;
        const dy = e.clientY - plannerAction.initialY;
        if (plannerAction.type === 'move') {
            let newTop = plannerAction.initialTop + dy;
            newTop = Math.max(0, newTop);
            newTop = Math.round(newTop / 15) * 15;
            plannerAction.target.style.top = `${newTop}px`;
        } else if (plannerAction.type === 'resize' || plannerAction.type === 'create') {
            let newHeight = (plannerAction.type === 'create' ? 30 : plannerAction.initialHeight) + dy;
            newHeight = Math.max(15, newHeight);
            newHeight = Math.round(newHeight / 15) * 15;
            plannerAction.target.style.height = `${newHeight}px`;
        }
    }

    function onPlannerMouseUp() {
        if (!plannerAction.active) return;
        const targetEl = plannerAction.target;

        plannerAction.active = false;
        document.removeEventListener('mousemove', onPlannerMouseMove);
        document.removeEventListener('mouseup', onPlannerMouseUp);

        if (plannerAction.type === 'create') {
            plannerInputModal.style.display = 'flex';
            plannerInputText.value = '';
            plannerInputText.focus();

            const saveHandler = () => {
                const text = plannerInputText.value;
                if (text && text.trim() !== '') {
                    const newEvent = { id: Date.now().toString(), todoId: 'todo_' + Date.now().toString(), text: text, startHour: 0, startMinutes: 0, durationMinutes: 0 };
                    state.plannerEvents.push(newEvent);
                    updatePlannerEventFromElementData(newEvent, targetEl.offsetTop, targetEl.offsetHeight);
                    renderPlannerEvents();
                } else {
                    targetEl.remove();
                }
                plannerInputModal.style.display = 'none';
            };
            
            plannerInputSave.addEventListener('click', saveHandler, { once: true });

        } else {
             updatePlannerEventFromElement(targetEl);
             renderPlannerEvents();
        }
    }

    function updatePlannerEventFromElementData(event, top, height) {
        if (!event) return;
        const totalMinutesFromStart = top;
        event.startHour = PLANNER_START_HOUR + Math.floor(totalMinutesFromStart / HOUR_HEIGHT);
        event.startMinutes = totalMinutesFromStart % HOUR_HEIGHT;
        event.durationMinutes = height;
        syncPlannerEventToTodo(event);
    }
    
    function updatePlannerEventFromElement(element) {
        const eventId = element.dataset.id;
        const event = state.plannerEvents.find(e => e.id === eventId);
        updatePlannerEventFromElementData(event, element.offsetTop, element.offsetHeight);
    }

    function sortTodosBasedOnPlanner() {
        const startTimeMap = new Map();
        state.plannerEvents.forEach(event => {
            const startTime = event.startHour * 60 + (event.startMinutes || 0);
            startTimeMap.set(event.todoId, startTime);
        });
        state.todos.vormittag.sort((a, b) => (startTimeMap.get(a.id) || Infinity) - (startTimeMap.get(b.id) || Infinity));
        state.todos.nachmittag.sort((a, b) => (startTimeMap.get(a.id) || Infinity) - (startTimeMap.get(b.id) || Infinity));
    }

    function syncPlannerEventToTodo(plannerEvent) {
        let correspondingTodo = findTodoById(plannerEvent.todoId, 'vormittag') || findTodoById(plannerEvent.todoId, 'nachmittag');
        const listName = (plannerEvent.startHour + (plannerEvent.startMinutes / 60)) < 13 ? 'vormittag' : 'nachmittag';

        if (!correspondingTodo) {
            correspondingTodo = { id: plannerEvent.todoId, text: plannerEvent.text, subtasks: [], notes: '', completed: false, time: plannerEvent.durationMinutes };
            state.todos[listName].push(correspondingTodo);
        } else {
            correspondingTodo.time = plannerEvent.durationMinutes;
            const otherList = listName === 'vormittag' ? 'nachmittag' : 'vormittag';
            const indexInOtherList = state.todos[otherList].findIndex(t => t.id === correspondingTodo.id);
            if (indexInOtherList > -1) {
                const [movedTodo] = state.todos[otherList].splice(indexInOtherList, 1);
                if (!state.todos[listName].find(t => t.id === movedTodo.id)) {
                    state.todos[listName].push(movedTodo);
                }
            }
        }
        
        sortTodosBasedOnPlanner();
        saveState();
        renderTodoList('vormittag');
        renderTodoList('nachmittag');
        updateDailyProgress();
    }
    
    function deletePlannerEventAndTodo(eventId) {
        const eventIndex = state.plannerEvents.findIndex(e => e.id === eventId);
        if (eventIndex === -1) return;
        const [deletedEvent] = state.plannerEvents.splice(eventIndex, 1);
        deletePlannerEventAndTodoByTodoId(deletedEvent.todoId);
    }

    function deletePlannerEventAndTodoByTodoId(todoId) {
        state.plannerEvents = state.plannerEvents.filter(e => e.todoId !== todoId);
        state.todos.vormittag = state.todos.vormittag.filter(t => t.id !== todoId);
        state.todos.nachmittag = state.todos.nachmittag.filter(t => t.id !== todoId);
        saveState();
        renderPlannerEvents();
        renderTodoList('vormittag');
        renderTodoList('nachmittag');
        updateDailyProgress();
    }

    function findNextAvailableSlot(durationMinutes) {
        const sortedEvents = [...state.plannerEvents].sort((a, b) => (a.startHour * 60 + a.startMinutes) - (b.startHour * 60 + b.startMinutes));
        let lastEndTime = PLANNER_START_HOUR * 60; // Start at 7:00 AM in minutes

        if (sortedEvents.length === 0) {
            return { startHour: 9, startMinutes: 0 }; // Default start time
        }

        for (const event of sortedEvents) {
            const eventStart = event.startHour * 60 + event.startMinutes;
            if (eventStart - lastEndTime >= durationMinutes) {
                // Found a gap
                return { startHour: Math.floor(lastEndTime / 60), startMinutes: lastEndTime % 60 };
            }
            lastEndTime = eventStart + event.durationMinutes;
        }

        // No gap found, place it at the end
        return { startHour: Math.floor(lastEndTime / 60), startMinutes: lastEndTime % 60 };
    }

    init();
});
