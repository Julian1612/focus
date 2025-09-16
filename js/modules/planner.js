// File: js/modules/planner.js
import { state, plannerAction, PLANNER_START_HOUR, HOUR_HEIGHT } from '../state.js';
import { $, saveState } from '../utils.js';
import { updateDailyProgress } from './timer.js';
import { renderAllTodos, findTodoById } from './todo.js';

const plannerContainer = $('.planner-container');
const plannerTimeline = $('.planner-timeline');
const plannerGrid = $('.planner-grid');
const plannerInputModal = $('#planner-input-modal');
const plannerInputText = $('#planner-input-text');
const plannerInputSave = $('#planner-input-save');
const plannerInputCancel = $('#planner-input-cancel');

export function renderPlannerEvents() {
    const events = plannerGrid.querySelectorAll('.planner-event');
    events.forEach(e => e.remove());
    state.plannerEvents.forEach(event => {
        const eventEl = document.createElement('div');
        eventEl.className = 'planner-event';
        eventEl.dataset.id = event.id;
        eventEl.dataset.category = event.category || 'focus';
        eventEl.innerHTML = `<span class="planner-event-text">${event.text}</span><button class="planner-delete-btn">&times;</button><div class="planner-event-resize-handle"></div>`;
        eventEl.style.top = `${(event.startHour - PLANNER_START_HOUR) * HOUR_HEIGHT + (event.startMinutes || 0)}px`;
        eventEl.style.height = `${event.durationMinutes}px`;
        plannerGrid.appendChild(eventEl);
    });
}

function updatePlannerEventFromElementData(event, top, height) {
    if (!event) return;
    const totalMinutesFromStart = top;
    event.startHour = PLANNER_START_HOUR + Math.floor(totalMinutesFromStart / HOUR_HEIGHT);
    event.startMinutes = totalMinutesFromStart % HOUR_HEIGHT;
    event.durationMinutes = height;
    syncPlannerEventToTodo(event);
}

function onPlannerMouseMove(e) {
    if (!plannerAction.active) return;
    const dy = e.clientY - plannerAction.initialY;
    const snap = 15;
    if (plannerAction.type === 'move') {
        let newTop = plannerAction.initialTop + dy;
        newTop = Math.max(0, Math.round(newTop / snap) * snap);
        plannerAction.target.style.top = `${newTop}px`;
    } else if (plannerAction.type === 'resize' || plannerAction.type === 'create') {
        let newHeight = (plannerAction.type === 'create' ? 30 : plannerAction.initialHeight) + dy;
        newHeight = Math.max(snap, Math.round(newHeight / snap) * snap);
        plannerAction.target.style.height = `${newHeight}px`;
    }
}

function onPlannerMouseUp() {
    if (!plannerAction.active) return;
    const targetEl = plannerAction.target;
    document.removeEventListener('mousemove', onPlannerMouseMove);
    document.removeEventListener('mouseup', onPlannerMouseUp);

    if (plannerAction.type === 'create') {
        plannerInputModal.style.display = 'flex';
        plannerInputText.value = '';
        plannerInputText.disabled = false;
        plannerInputText.focus();
        // Import renderCategorySelectors dynamically or call from main
        document.getElementById('add-todo-category-container').dispatchEvent(new Event('render'));


        const saveHandler = () => {
            const text = plannerInputText.value;
            const activeCategoryButton = plannerInputModal.querySelector('.category-box.active');
            const selectedCategory = activeCategoryButton ? activeCategoryButton.dataset.category : 'focus';
            if (text && text.trim() !== '') {
                targetEl.classList.remove('temp');
                const newEvent = {
                    id: 'event_' + Date.now().toString(),
                    todoId: 'todo_' + Date.now().toString(),
                    text: text,
                    category: selectedCategory
                };
                state.plannerEvents.push(newEvent);
                updatePlannerEventFromElementData(newEvent, targetEl.offsetTop, targetEl.offsetHeight);
            } else {
                targetEl.remove();
            }
            plannerInputModal.style.display = 'none';
            plannerInputSave.removeEventListener('click', saveHandler);
        };
        plannerInputSave.addEventListener('click', saveHandler, { once: true });
    } else {
        const eventId = targetEl.dataset.id;
        const event = state.plannerEvents.find(e => e.id === eventId);
        updatePlannerEventFromElementData(event, targetEl.offsetTop, targetEl.offsetHeight);
        renderPlannerEvents(); // Re-render to snap to final position
    }
    plannerAction.active = false;
}

function handlePlannerInteraction(e) {
    if (e.button !== 0 || plannerInputModal.style.display === 'flex') return;
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
        newEventEl.className = 'planner-event temp';
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

export function syncPlannerEventToTodo(plannerEvent) {
    let correspondingTodo = findTodoById(plannerEvent.todoId, 'vormittag') || findTodoById(plannerEvent.todoId, 'nachmittag');
    const listName = (plannerEvent.startHour + (plannerEvent.startMinutes / 60)) < 13 ? 'vormittag' : 'nachmittag';

    if (!correspondingTodo) {
        correspondingTodo = {
            id: plannerEvent.todoId,
            text: plannerEvent.text,
            subtasks: [],
            notes: '',
            completed: false,
            time: plannerEvent.durationMinutes,
            category: plannerEvent.category
        };
        state.todos[listName].push(correspondingTodo);
    } else {
        correspondingTodo.time = plannerEvent.durationMinutes;
        correspondingTodo.category = plannerEvent.category;
        const otherList = listName === 'vormittag' ? 'nachmittag' : 'vormittag';
        const indexInOtherList = state.todos[otherList].findIndex(t => t.id === correspondingTodo.id);
        if (indexInOtherList > -1) {
            const [movedTodo] = state.todos[otherList].splice(indexInOtherList, 1);
            if (!state.todos[listName].find(t => t.id === movedTodo.id)) {
                state.todos[listName].push(movedTodo);
            }
        }
    }
    saveState();
    renderAllTodos();
    renderPlannerEvents();
    updateDailyProgress();
}

function deletePlannerEventAndTodo(eventId) {
    const eventIndex = state.plannerEvents.findIndex(e => e.id === eventId);
    if (eventIndex === -1) return;
    const [deletedEvent] = state.plannerEvents.splice(eventIndex, 1);
    deletePlannerEventAndTodoByTodoId(deletedEvent.todoId);
}

export function deletePlannerEventAndTodoByTodoId(todoId) {
    state.plannerEvents = state.plannerEvents.filter(e => e.todoId !== todoId);
    state.todos.vormittag = state.todos.vormittag.filter(t => t.id !== todoId);
    state.todos.nachmittag = state.todos.nachmittag.filter(t => t.id !== todoId);
    saveState();
    renderAllTodos();
    renderPlannerEvents();
    updateDailyProgress();
}

export function findNextAvailableSlot(durationMinutes) {
    const sortedEvents = [...state.plannerEvents].sort((a, b) => (a.startHour * 60 + a.startMinutes) - (b.startHour * 60 + b.startMinutes));
    let lastEndTime = PLANNER_START_HOUR * 60;
    if (sortedEvents.length === 0) {
        return { startHour: 9, startMinutes: 0 };
    }
    for (const event of sortedEvents) {
        const eventStart = event.startHour * 60 + event.startMinutes;
        if (eventStart - lastEndTime >= durationMinutes) {
            return { startHour: Math.floor(lastEndTime / 60), startMinutes: lastEndTime % 60 };
        }
        lastEndTime = eventStart + event.durationMinutes;
    }
    return { startHour: Math.floor(lastEndTime / 60), startMinutes: lastEndTime % 60 };
}

function renderPlannerTimeline() {
    plannerTimeline.innerHTML = '';
    for (let hour = PLANNER_START_HOUR; hour <= 21; hour++) {
        const timeSlot = document.createElement('div');
        timeSlot.textContent = `${hour.toString().padStart(2, '0')}:00`;
        plannerTimeline.appendChild(timeSlot);
    }
}

function updateCurrentTimeIndicator() {
    const indicator = $('#time-indicator');
    if (!indicator) return;
    const now = new Date();
    const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
    const plannerStartMinutes = PLANNER_START_HOUR * 60;
    const plannerEndMinutes = 21 * 60;
    const currentPositionInMinutes = minutesSinceMidnight - plannerStartMinutes;
    if (minutesSinceMidnight >= plannerStartMinutes && minutesSinceMidnight <= plannerEndMinutes) {
        indicator.style.display = 'block';
        indicator.style.top = `${currentPositionInMinutes}px`;
    } else {
        indicator.style.display = 'none';
    }
}

export function initPlanner() {
    renderPlannerTimeline();
    renderPlannerEvents();
    updateCurrentTimeIndicator();
    setInterval(updateCurrentTimeIndicator, 60000);
    plannerGrid.addEventListener('mousedown', handlePlannerInteraction);
    plannerInputCancel.addEventListener('click', () => {
        plannerInputModal.style.display = 'none';
        const tempEvent = plannerGrid.querySelector('.planner-event.temp');
        if (tempEvent) tempEvent.remove();
    });
}