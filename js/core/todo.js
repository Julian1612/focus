import { ICONS, playSound } from './ui.js';
import { startTimer, cancelTimer, togglePauseTimer } from './timer.js';
import { syncPlannerEventToTodo, deletePlannerEventAndTodoByTodoId, findNextAvailableSlot } from './planner.js';

// --- Private variables ---
let _state;
let _saveStateCallback;
let _renderCallback;
let activeSubtaskForm = null;

// --- DOM Elements ---
const form = document.querySelector('.add-todo-form');
const lists = {
    allTodos: document.getElementById('list-all-todos'),
    completedAllTodos: document.getElementById('completed-list-all-todos')
};
const dividers = {
    allTodos: document.getElementById('divider-all-todos')
};

// --- Initialization ---
export function initTodo(state, saveState, render) {
    _state = state;
    _saveStateCallback = saveState;
    _renderCallback = render;
    addEventListeners();
}

// --- Rendering ---
export function renderAllTodos() {
    lists.allTodos.innerHTML = '';
    lists.completedAllTodos.innerHTML = '';
    
    const allTasks = [..._state.todos.vormittag, ..._state.todos.nachmittag];
    const startTimeMap = new Map();
    _state.plannerEvents.forEach(event => {
        const startTime = event.startHour * 60 + (event.startMinutes || 0);
        startTimeMap.set(event.todoId, startTime);
    });

    allTasks.sort((a, b) => (startTimeMap.get(a.id) || Infinity) - (startTimeMap.get(b.id) || Infinity));
    
    const activeTasks = allTasks.filter(t => !t.completed);
    const completedTasks = allTasks.filter(t => t.completed);

    const findListName = (todoId) => {
        return _state.todos.vormittag.some(t => t.id === todoId) ? 'vormittag' : 'nachmittag';
    };

    activeTasks.forEach(todo => lists.allTodos.appendChild(createTaskElement(todo, findListName(todo.id))));
    completedTasks.forEach(todo => lists.completedAllTodos.appendChild(createTaskElement(todo, findListName(todo.id))));
    
    dividers.allTodos.style.display = completedTasks.length > 0 ? 'block' : 'none';
}

function createTaskElement(todo, listName) {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    li.dataset.id = todo.id;
    li.dataset.list = listName;
    li.dataset.text = todo.text;
    
    li.innerHTML = `
        <div class="todo-item-main">
            <input type="checkbox" ${todo.completed ? 'checked' : ''}>
            <span class="task-content">${todo.text}</span>
            <div class="task-actions">
                <button class="add-subtask-btn" title="Unteraufgabe hinzufügen"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg></button>
                <button class="toggle-notes-btn" title="Notizen anzeigen/verbergen"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg></button>
                <button class="delete-btn" title="Löschen"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                <button class="task-timer-btn" title="Timer starten">${ICONS.play}</button>
            </div>
            <span class="task-time">${todo.time} min</span>
        </div>
        <textarea class="notes-area" style="display: none;">${todo.notes || ''}</textarea>
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

// --- Event Handlers ---
function addEventListeners() {
    form.addEventListener('submit', handleAddTodo);
    document.body.addEventListener('click', handleBodyClick);
    document.body.addEventListener('change', handleCheckboxChange);
    document.body.addEventListener('blur', handleNotesBlur, true);
    document.body.addEventListener('submit', handleSubtaskSubmit);
    document.body.addEventListener('dblclick', handleDoubleClickEdit);
    document.addEventListener('click', (e) => {
        if (activeSubtaskForm && !activeSubtaskForm.closest('.todo-item').contains(e.target)) {
            activeSubtaskForm.style.display = 'none';
            activeSubtaskForm = null;
        }
    });
}

function handleAddTodo(e) {
    e.preventDefault();
    const textInput = form.querySelector('input[type="text"]');
    const timeInput = form.querySelector('input[type="number"]');
    const activeCategoryButton = form.querySelector('.category-box.active');
    
    const text = textInput.value.trim();
    const time = parseInt(timeInput.value, 10);
    if (!text || isNaN(time) || time <= 0) return;
    
    const selectedCategory = activeCategoryButton ? activeCategoryButton.dataset.category : 'focus';
    const todoId = 'todo_' + Date.now().toString();

    const { startHour, startMinutes } = findNextAvailableSlot(time);
    
    const newPlannerEvent = {
        id: 'event_' + Date.now().toString(),
        todoId: todoId,
        text: text,
        startHour: startHour,
        startMinutes: startMinutes,
        durationMinutes: time,
        category: selectedCategory
    };

    _state.plannerEvents.push(newPlannerEvent);
    syncPlannerEventToTodo(newPlannerEvent);
    
    form.reset();
    textInput.disabled = false;
    // Reset category selector in ui module
}

function handleBodyClick(e) {
    const todoItem = e.target.closest('.todo-item');
    if (!todoItem) return;

    const id = todoItem.dataset.id;
    const listName = todoItem.dataset.list;
    const todo = findTodoById(id, listName);
    if (!todo) return;
    
    if (e.target.closest('.task-timer-btn')) {
        if (_state.timer.activeTaskItem && _state.timer.activeTaskItem.dataset.id === id) {
            togglePauseTimer();
        } else {
            if (_state.timer.isRunning || _state.timer.isPaused) cancelTimer();
            startTimer(todo.time * 60, todoItem);
        }
    } else if (e.target.closest('.delete-btn')) {
        deletePlannerEventAndTodoByTodoId(id);
    } else if (e.target.closest('.toggle-notes-btn')) {
        const notesArea = todoItem.querySelector('.notes-area');
        notesArea.style.display = notesArea.style.display === 'none' ? 'block' : 'none';
        if (notesArea.style.display === 'block') notesArea.focus();
    } else if (e.target.closest('.add-subtask-btn')) {
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
    } else if (e.target.closest('.delete-subtask-btn')) {
        const index = parseInt(e.target.closest('.delete-subtask-btn').dataset.index, 10);
        todo.subtasks.splice(index, 1);
        _saveStateCallback();
        renderSubtasks(todoItem, todo);
    }
}

function handleCheckboxChange(e) {
    const target = e.target;
    if (target.type !== 'checkbox') return;

    const todoItem = target.closest('.todo-item');
    if (!todoItem) return;

    const id = todoItem.dataset.id;
    const listName = todoItem.dataset.list;
    const todo = findTodoById(id, listName);
    if (!todo) return;

    if (target.closest('.subtask-item')) {
        const index = parseInt(target.dataset.index, 10);
        todo.subtasks[index].completed = target.checked;
        _saveStateCallback();
        renderSubtasks(todoItem, todo);
    } else if (target.parentElement.classList.contains('todo-item-main')) {
        todo.completed = target.checked;
        if (target.checked) {
            if (_state.timer.activeTaskItem && _state.timer.activeTaskItem.dataset.id === id) {
                cancelTimer();
            }
            playSound();
            _state.totalTimeWorked += todo.time;
        } else {
            _state.totalTimeWorked -= todo.time;
        }
        _saveStateCallback();
        _renderCallback();
    }
}

function handleNotesBlur(e) {
    if (e.target.classList.contains('notes-area')) {
        const todoItem = e.target.closest('.todo-item');
        const id = todoItem.dataset.id;
        const listName = todoItem.dataset.list;
        const todo = findTodoById(id, listName);
        if (todo) {
            todo.notes = e.target.value;
            _saveStateCallback();
        }
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
        if (todo && input.value.trim()) {
            todo.subtasks.push({ text: input.value.trim(), completed: false });
            _saveStateCallback();
            renderSubtasks(parentTodoItem, todo);
            form.reset();
        }
    }
}

function handleDoubleClickEdit(e) {
    const taskContentSpan = e.target.closest('.task-content');
    if (!taskContentSpan) return;

    const todoItem = taskContentSpan.closest('.todo-item');
    if (!todoItem || todoItem.querySelector('.edit-task-input')) return;

    const originalText = todoItem.dataset.text;
    taskContentSpan.style.display = 'none';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalText;
    input.className = 'edit-task-input';
    
    taskContentSpan.parentNode.insertBefore(input, taskContentSpan);
    input.focus();
    input.select();

    const finishEditing = () => {
        const newText = input.value.trim();
        input.removeEventListener('blur', finishEditing);
        input.removeEventListener('keydown', handleKeydown);

        if (newText && newText !== originalText) {
            const todoId = todoItem.dataset.id;
            updateTodoText(todoId, newText);
        } else {
            input.remove();
            taskContentSpan.style.display = 'block';
        }
    };
    
    const handleKeydown = (event) => {
        if (event.key === 'Enter') finishEditing();
        else if (event.key === 'Escape') {
            input.value = originalText;
            finishEditing();
        }
    };

    input.addEventListener('blur', finishEditing);
    input.addEventListener('keydown', handleKeydown);
}

// --- Helper Functions ---
function findTodoById(id, listName) {
    return _state.todos[listName]?.find(t => t.id === id);
}

function updateTodoText(todoId, newText) {
    let todoUpdated = false;
    for (const listName in _state.todos) {
        const todo = _state.todos[listName].find(t => t.id === todoId);
        if (todo) {
            todo.text = newText;
            todoUpdated = true;
            break;
        }
    }

    if (todoUpdated) {
        const eventToUpdate = _state.plannerEvents.find(e => e.todoId === todoId);
        if (eventToUpdate) {
            eventToUpdate.text = newText;
        }
        _saveStateCallback();
        _renderCallback();
    }
}