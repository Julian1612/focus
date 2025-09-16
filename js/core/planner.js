import { renderCategorySelectors } from './ui.js';

// --- Constants ---
const PLANNER_START_HOUR = 7;
const HOUR_HEIGHT = 60;

// --- Private variables ---
let _state;
let _saveStateCallback;
let _renderCallback;
let plannerAction = { active: false, type: null, target: null, initialY: 0, initialTop: 0, initialHeight: 0 };

// --- DOM Elements ---
const plannerTimeline = document.querySelector('.planner-timeline');
const plannerGrid = document.querySelector('.planner-grid');
const timeIndicator = document.getElementById('time-indicator');
const plannerInputModal = document.getElementById('planner-input-modal');
const plannerInputText = document.getElementById('planner-input-text');
const plannerInputSave = document.getElementById('planner-input-save');
const plannerInputCancel = document.getElementById('planner-input-cancel');

// --- Initialization ---
export function initPlanner(state, saveState, render) {
    _state = state;
    _saveStateCallback = saveState;
    _renderCallback = render;
    
    renderPlannerTimeline();
    updateCurrentTimeIndicator();
    setInterval(updateCurrentTimeIndicator, 60000); // Update every minute
    
    addEventListeners();
}

// --- Rendering ---
function renderPlannerTimeline() {
    plannerTimeline.innerHTML = '';
    for (let hour = PLANNER_START_HOUR; hour <= 21; hour++) {
        const timeSlot = document.createElement('div');
        timeSlot.textContent = `${hour}:00`;
        plannerTimeline.appendChild(timeSlot);
    }
}

export function renderPlannerEvents() {
    plannerGrid.querySelectorAll('.planner-event').forEach(e => e.remove());
    _state.plannerEvents.forEach(event => {
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

function updateCurrentTimeIndicator() {
    const now = new Date();
    const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
    const plannerStartMinutes = PLANNER_START_HOUR * 60;
    const plannerEndMinutes = 21 * 60;
    
    if (minutesSinceMidnight >= plannerStartMinutes && minutesSinceMidnight <= plannerEndMinutes) {
        const currentPositionInMinutes = minutesSinceMidnight - plannerStartMinutes;
        timeIndicator.style.display = 'block';
        timeIndicator.style.top = `${currentPositionInMinutes}px`;
    } else {
        timeIndicator.style.display = 'none';
    }
}

// --- Event Handlers & Interaction Logic ---
function addEventListeners() {
    plannerGrid.addEventListener('mousedown', handlePlannerInteraction);
    plannerInputCancel.addEventListener('click', () => {
        plannerInputModal.style.display = 'none';
        const tempEvent = plannerGrid.querySelector('.planner-event.temp');
        if (tempEvent) tempEvent.remove();
    });
}

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
        newEventEl.className = 'planner-event temp';
        const startTop = e.offsetY - (e.offsetY % 15);
        newEventEl.style.top = `${startTop}px`;
        newEventEl.style.height = '30px';
        plannerGrid.appendChild(newEventEl);
        plannerAction.target = newEventEl;
        plannerAction.initialTop = startTop;
    }

    document.addEventListener('mousemove', onPlannerMouseMove);
    document.addEventListener('mouseup', onPlannerMouseUp, { once: true });
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
    document.removeEventListener('mousemove', onPlannerMouseMove);
    if (!plannerAction.active) return;
    
    const targetEl = plannerAction.target;

    if (plannerAction.type === 'create') {
        plannerInputModal.style.display = 'flex';
        plannerInputText.value = '';
        plannerInputText.disabled = false;
        renderCategorySelectors();
        plannerInputText.focus();

        const saveHandler = () => {
            const text = plannerInputText.value.trim();
            if (text) {
                const activeCategoryButton = plannerInputModal.querySelector('.category-box.active');
                const selectedCategory = activeCategoryButton ? activeCategoryButton.dataset.category : 'focus';
                
                targetEl.classList.remove('temp');
                const newEvent = {
                    id: 'event_' + Date.now().toString(),
                    todoId: 'todo_' + Date.now().toString(),
                    text: text,
                    category: selectedCategory
                };
                _state.plannerEvents.push(newEvent);
                updatePlannerEventFromElementData(newEvent, targetEl.offsetTop, targetEl.offsetHeight);
            } else {
                targetEl.remove();
            }
            plannerInputModal.style.display = 'none';
        };
        plannerInputSave.addEventListener('click', saveHandler, { once: true });

    } else {
        updatePlannerEventFromElement(targetEl);
    }
    
    plannerAction.active = false;
}

// --- Data Syncing and Management ---
function updatePlannerEventFromElement(element) {
    const event = _state.plannerEvents.find(e => e.id === element.dataset.id);
    updatePlannerEventFromElementData(event, element.offsetTop, element.offsetHeight);
}

function updatePlannerEventFromElementData(event, top, height) {
    if (!event) return;
    const totalMinutesFromStart = top;
    event.startHour = PLANNER_START_HOUR + Math.floor(totalMinutesFromStart / HOUR_HEIGHT);
    event.startMinutes = totalMinutesFromStart % HOUR_HEIGHT;
    event.durationMinutes = height;
    syncPlannerEventToTodo(event);
}

export function syncPlannerEventToTodo(plannerEvent) {
    const allTodos = [..._state.todos.vormittag, ..._state.todos.nachmittag];
    let correspondingTodo = allTodos.find(t => t.id === plannerEvent.todoId);

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
        _state.todos[listName].push(correspondingTodo);
    } else {
        correspondingTodo.time = plannerEvent.durationMinutes;
        correspondingTodo.category = plannerEvent.category;

        const otherList = listName === 'vormittag' ? 'nachmittag' : 'vormittag';
        const indexInOtherList = _state.todos[otherList].findIndex(t => t.id === correspondingTodo.id);
        
        if (indexInOtherList > -1) {
            const [movedTodo] = _state.todos[otherList].splice(indexInOtherList, 1);
            if (!_state.todos[listName].find(t => t.id === movedTodo.id)) {
                _state.todos[listName].push(movedTodo);
            }
        }
    }
    _saveStateCallback();
    _renderCallback();
}

function deletePlannerEventAndTodo(eventId) {
    const eventIndex = _state.plannerEvents.findIndex(e => e.id === eventId);
    if (eventIndex === -1) return;
    
    const [deletedEvent] = _state.plannerEvents.splice(eventIndex, 1);
    deletePlannerEventAndTodoByTodoId(deletedEvent.todoId);
}

export function deletePlannerEventAndTodoByTodoId(todoId) {
    _state.plannerEvents = _state.plannerEvents.filter(e => e.todoId !== todoId);
    _state.todos.vormittag = _state.todos.vormittag.filter(t => t.id !== todoId);
    _state.todos.nachmittag = _state.todos.nachmittag.filter(t => t.id !== todoId);
    _saveStateCallback();
    _renderCallback();
}

export function findNextAvailableSlot(durationMinutes) {
    const sortedEvents = [..._state.plannerEvents].sort((a, b) => (a.startHour * 60 + (a.startMinutes || 0)) - (b.startHour * 60 + (b.startMinutes || 0)));
    let lastEndTime = PLANNER_START_HOUR * 60;

    if (sortedEvents.length > 0) {
        const lastEvent = sortedEvents[sortedEvents.length - 1];
        lastEndTime = (lastEvent.startHour * 60 + (lastEvent.startMinutes || 0)) + lastEvent.durationMinutes;
    } else {
        lastEndTime = 9 * 60; // Default start time for the first task
    }

    // Snap to the next 15-minute interval
    lastEndTime = Math.ceil(lastEndTime / 15) * 15;

    return {
        startHour: Math.floor(lastEndTime / 60),
        startMinutes: lastEndTime % 60
    };
}