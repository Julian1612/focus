// File: js/modules/todo.js
import { state, activeSubtaskForm, setActiveSubtaskForm } from '../state.js';
import { $, ICONS, CATEGORIES, saveState, playSound } from '../utils.js';
import { startTimer, updateDailyProgress, cancelTimer } from './timer.js';
import { findNextAvailableSlot, syncPlannerEventToTodo, deletePlannerEventAndTodoByTodoId, renderPlannerEvents } from './planner.js';

const form = $('.add-todo-form');
const todoListContainer = $('.todo-list-container');
const lists = {
    allTodos: $('#list-all-todos'),
    completedAllTodos: $('#completed-list-all-todos')
};
const dividers = {
    allTodos: $('#divider-all-todos')
};

function saveAndRerender() {
    saveState();
    renderAllTodos();
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

export function renderAllTodos() {
    lists.allTodos.innerHTML = '';
    lists.completedAllTodos.innerHTML = '';
    const allTasks = [...state.todos.vormittag, ...state.todos.nachmittag];

    const startTimeMap = new Map();
    state.plannerEvents.forEach(event => {
        const startTime = (event.startHour * 60) + (event.startMinutes || 0);
        startTimeMap.set(event.todoId, startTime);
    });

    allTasks.sort((a, b) => (startTimeMap.get(a.id) || Infinity) - (startTimeMap.get(b.id) || Infinity));
    const activeTasks = allTasks.filter(t => !t.completed);
    const completedTasks = allTasks.filter(t => t.completed);

    const findListName = (todoId) => {
        return state.todos.vormittag.some(t => t.id === todoId) ? 'vormittag' : 'nachmittag';
    };

    activeTasks.forEach(todo => lists.allTodos.appendChild(createTaskElement(todo, findListName(todo.id))));
    completedTasks.forEach(todo => lists.completedAllTodos.appendChild(createTaskElement(todo, findListName(todo.id))));
    dividers.allTodos.style.display = completedTasks.length > 0 ? 'block' : 'none';
}

// THIS FUNCTION IS NOW EXPORTED
export function findTodoById(id, listName) { return state.todos[listName]?.find(t => t.id === id); }

function handleAddTodo(e) {
    e.preventDefault();
    const textInput = form.querySelector('input[type="text"]');
    const timeInput = form.querySelector('input[type="number"]');
    const activeCategoryButton = form.querySelector('.category-box.active');
    const selectedCategory = activeCategoryButton ? activeCategoryButton.dataset.category : 'focus';
    const text = textInput.value;
    const time = parseInt(timeInput.value, 10);
    if (!text || isNaN(time)) return;

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
    state.plannerEvents.push(newPlannerEvent);
    syncPlannerEventToTodo(newPlannerEvent);

    form.reset();
    textInput.disabled = false;
    form.querySelector('input[type="text"]').focus();
    renderCategorySelectors();
}

function handleTodoItemClick(e) {
    const target = e.target;
    const todoItem = target.closest('.todo-item');
    if (!todoItem) return;

    const id = todoItem.dataset.id;
    const listName = todoItem.dataset.list;
    const todo = findTodoById(id, listName);

    if (target.closest('.task-timer-btn')) {
        if (state.timer.activeTaskItem && state.timer.activeTaskItem.dataset.id === id) {
            // Directly call the function instead of simulating a click
            // This avoids depending on the DOM element existing.
            // Let's check the timer module for `togglePauseTimer`
            // It is not exported, so let's stick with the click simulation for now.
            // A better refactor would export togglePauseTimer.
            $('#timer-control-btn').click();
        } else {
            if (state.timer.isRunning || state.timer.isPaused) {
                cancelTimer();
            }
            startTimer(todo.time * 60, todoItem);
        }
    } else if (target.closest('.delete-btn')) {
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
        setActiveSubtaskForm(isVisible ? null : subtaskForm);
        if (!isVisible) subtaskForm.querySelector('input').focus();
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

    const todoItem = target.closest('.todo-item');
    if (!todoItem) return;

    const id = todoItem.dataset.id;
    const listName = todoItem.dataset.list;
    const todo = findTodoById(id, listName);

    if (target.parentElement.classList.contains('todo-item-main')) { // Main task checkbox
        todo.completed = target.checked;
        if (target.checked && state.timer.activeTaskItem && state.timer.activeTaskItem.dataset.id === id) {
            cancelTimer();
        }
        if (target.checked) {
            playSound();
            state.totalTimeWorked += todo.time;
        } else {
            state.totalTimeWorked -= todo.time;
        }
        saveAndRerender();
        updateDailyProgress();
    } else { // Subtask checkbox
        const index = parseInt(target.dataset.index, 10);
        todo.subtasks[index].completed = target.checked;
        saveState();
        renderSubtasks(todoItem, todo);
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
        if (!input.value.trim()) return;
        const parentTodoItem = form.closest('.todo-item');
        const id = parentTodoItem.dataset.id;
        const listName = parentTodoItem.dataset.list;
        const todo = findTodoById(id, listName);
        if (!todo.subtasks) todo.subtasks = [];
        todo.subtasks.push({ text: input.value, completed: false });
        saveState();
        renderSubtasks(parentTodoItem, todo);
        form.reset();
        input.focus();
    }
}

function updateTodoText(todoId, newText) {
    let todoUpdated = false;
    for (const listName in state.todos) {
        const todo = state.todos[listName].find(t => t.id === todoId);
        if (todo) {
            todo.text = newText;
            todoUpdated = true;
            break;
        }
    }

    if (todoUpdated) {
        const eventToUpdate = state.plannerEvents.find(e => e.todoId === todoId);
        if (eventToUpdate) {
            eventToUpdate.text = newText;
        }
        saveAndRerender();
        renderPlannerEvents();
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
            updateTodoText(todoItem.dataset.id, newText);
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

export function renderCategorySelectors() {
    const containers = [
        $('#add-todo-category-container'),
        $('#planner-input-category-container')
    ];
    containers.forEach(container => {
        if (!container) return;
        container.innerHTML = '';
        let isFirst = true;
        for (const key in CATEGORIES) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'category-box';
            button.dataset.category = key;
            button.textContent = CATEGORIES[key].name;

            if (isFirst) {
                button.classList.add('active');
                const activeColor = CATEGORIES[key].color;
                button.style.borderColor = activeColor;
                button.style.backgroundColor = `rgba(${parseInt(activeColor.slice(1,3),16)},${parseInt(activeColor.slice(3,5),16)},${parseInt(activeColor.slice(5,7),16)},0.2)`;
                isFirst = false;
            } else {
                button.style.borderColor = 'var(--border-color)';
            }
            container.appendChild(button);
        }
    });
}

function handleCategoryClick(e) {
    if (!e.target.classList.contains('category-box')) return;

    const container = e.target.parentElement;
    container.querySelectorAll('.category-box').forEach(btn => {
        btn.classList.remove('active');
        btn.style.backgroundColor = 'transparent';
        btn.style.borderColor = 'var(--border-color)';
    });

    e.target.classList.add('active');
    const activeCategoryKey = e.target.dataset.category;
    const activeColor = CATEGORIES[activeCategoryKey].color;
    e.target.style.borderColor = activeColor;
    e.target.style.backgroundColor = `rgba(${parseInt(activeColor.slice(1,3),16)},${parseInt(activeColor.slice(3,5),16)},${parseInt(activeColor.slice(5,7),16)},0.2)`;
    
    const textInput = e.target.closest('#planner-input-modal') ? $('#planner-input-text') : form.querySelector('input[type="text"]');
    
    if (activeCategoryKey === 'pause') {
        textInput.value = 'Pause';
        textInput.disabled = true;
    } else {
        if (textInput.value === 'Pause') textInput.value = '';
        textInput.disabled = false;
    }
}

export function initTodo() {
    renderCategorySelectors();
    form.addEventListener('submit', handleAddTodo);
    todoListContainer.addEventListener('click', handleTodoItemClick);
    todoListContainer.addEventListener('change', handleCheckboxChange);
    todoListContainer.addEventListener('blur', handleNotesBlur, true);
    todoListContainer.addEventListener('submit', handleSubtaskSubmit);
    todoListContainer.addEventListener('dblclick', handleDoubleClickEdit);
    document.body.addEventListener('click', handleCategoryClick);

    // Global click listener to close active subtask form
    document.addEventListener('click', (e) => {
        if (activeSubtaskForm && !activeSubtaskForm.closest('.todo-item').contains(e.target)) {
            activeSubtaskForm.style.display = 'none';
            setActiveSubtaskForm(null);
        }
    });
}