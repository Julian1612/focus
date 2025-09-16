import { ICONS, playSound, updateDailyProgress } from './ui.js';

// --- Private variables ---
let _state;
let _saveStateCallback;
let _renderCallback;
let totalDurationForProgress = 0;

// --- DOM Elements ---
const modals = { focusSession: document.getElementById('modal-focus-session') };
const modalButtons = { focusSession: document.getElementById('focus-session-btn') };
const timerDisplay = document.getElementById('timer-display');
const globalTimerDisplay = document.getElementById('global-timer-display');
const timerControlButton = document.getElementById('timer-control-btn');
const timerCancelButton = document.getElementById('timer-cancel-btn');
const startNextTaskBtn = document.getElementById('start-next-task-btn');
const globalStartNextBtn = document.getElementById('global-start-next-btn');
const timerProgressBand = document.getElementById('timer-progress-band');

// --- Initialization ---
export function initTimer(state, saveState, render) {
    _state = state;
    _saveStateCallback = saveState;
    _renderCallback = render;
    addEventListeners();
    updateFocusSessionView();
    updateGlobalControlsView();
}

function addEventListeners() {
    modalButtons.focusSession.addEventListener('click', () => toggleModal(modals.focusSession, true));
    modals.focusSession.addEventListener('click', e => {
        if (e.target === modals.focusSession || e.target.classList.contains('modal-close-btn')) {
            toggleModal(modals.focusSession, false);
        }
    });

    timerControlButton.addEventListener('click', togglePauseTimer);
    timerCancelButton.addEventListener('click', cancelTimer);
    startNextTaskBtn.addEventListener('click', startNextTask);
    globalStartNextBtn.addEventListener('click', startNextTask);
}

// --- Timer Control Functions ---
export function startTimer(duration, taskItem) {
    if (_state.timer.isRunning || _state.timer.isPaused) return;

    totalDurationForProgress = duration;
    timerProgressBand.style.background = `conic-gradient(var(--accent-color) 360deg, transparent 360deg)`;
    
    _state.timer.secondsLeft = duration;
    _state.timer.isRunning = true;
    _state.timer.isPaused = false;

    if (_state.timer.activeTaskItem) {
        _state.timer.activeTaskItem.classList.remove('timer-active');
    }
    
    taskItem.classList.add('timer-active');
    taskItem.querySelector('.task-timer-btn').innerHTML = ICONS.pause;
    _state.timer.activeTaskItem = taskItem;

    _state.timer.interval = setInterval(updateTimer, 1000);
    
    updateTimerUI();
    modalButtons.focusSession.classList.add('active');
    updateFocusSessionView();
    updateGlobalControlsView();
}

export function togglePauseTimer() {
    if (!_state.timer.activeTaskItem) return;
    _state.timer.isPaused = !_state.timer.isPaused;

    if (_state.timer.isPaused) {
        _state.timer.isRunning = false;
        clearInterval(_state.timer.interval);
        timerControlButton.textContent = 'Fortsetzen';
        _state.timer.activeTaskItem.querySelector('.task-timer-btn').innerHTML = ICONS.play;
    } else {
        _state.timer.isRunning = true;
        _state.timer.interval = setInterval(updateTimer, 1000);
        timerControlButton.textContent = 'Pause';
        _state.timer.activeTaskItem.querySelector('.task-timer-btn').innerHTML = ICONS.pause;
    }
}

export function cancelTimer() {
    clearInterval(_state.timer.interval);
    resetTimerState();
}

export function startNextTask() {
    const allTasks = [..._state.todos.vormittag, ..._state.todos.nachmittag];
    const nextTodo = allTasks.find(t => !t.completed);
    
    if (nextTodo) {
        const todoItemElement = document.querySelector(`.todo-item[data-id='${nextTodo.id}']`);
        if (todoItemElement) {
            startTimer(nextTodo.time * 60, todoItemElement);
        }
    } else {
        startNextTaskBtn.textContent = 'Alle Aufgaben erledigt!';
        globalStartNextBtn.textContent = 'Fertig!';
        setTimeout(() => {
            startNextTaskBtn.textContent = 'Nächste Aufgabe starten';
            globalStartNextBtn.textContent = '▶ Nächste';
        }, 2000);
    }
}

// --- UI & State Update Functions ---
function updateTimer() {
    _state.timer.secondsLeft--;
    updateTimerUI();

    const percentage = _state.timer.secondsLeft / totalDurationForProgress;
    const angle = percentage * 360;
    timerProgressBand.style.background = `conic-gradient(var(--accent-color) ${angle}deg, transparent ${angle}deg)`;

    if (_state.timer.secondsLeft < 0) {
        clearInterval(_state.timer.interval);
        const checkbox = _state.timer.activeTaskItem.querySelector('input[type="checkbox"]');
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change', { bubbles: true })); // This will trigger the completion logic in todo.js
        resetTimerState();
    }
}

function resetTimerState() {
    if (_state.timer.activeTaskItem) {
        _state.timer.activeTaskItem.classList.remove('timer-active');
        _state.timer.activeTaskItem.querySelector('.task-timer-btn').innerHTML = ICONS.play;
    }
    _state.timer = { interval: null, secondsLeft: 1500, isRunning: false, isPaused: false, activeTaskItem: null };
    
    updateTimerUI();
    modalButtons.focusSession.classList.remove('active');
    document.title = 'Fokus Dashboard';
    updateFocusSessionView();
    updateGlobalControlsView();
}

function updateTimerUI() {
    const minutes = Math.floor(Math.max(0, _state.timer.secondsLeft) / 60);
    const seconds = Math.max(0, _state.timer.secondsLeft) % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    timerDisplay.textContent = display;
    globalTimerDisplay.textContent = display;
    
    if (_state.timer.isRunning || _state.timer.isPaused) {
        document.title = `${display} - Fokus Dashboard`;
    }
}

function updateFocusSessionView() {
    const timerIsActive = _state.timer.isRunning || _state.timer.isPaused;
    document.getElementById('timer-display-container').style.display = 'block';
    timerDisplay.style.display = timerIsActive ? 'block' : 'none';
    startNextTaskBtn.style.display = timerIsActive ? 'none' : 'block';
    document.querySelector('.timer-controls').style.display = timerIsActive ? 'flex' : 'none';
}

function updateGlobalControlsView() {
    const timerIsActive = _state.timer.isRunning || _state.timer.isPaused;
    globalTimerDisplay.style.display = timerIsActive ? 'block' : 'none';
    timerProgressBand.style.display = timerIsActive ? 'block' : 'none';
    globalStartNextBtn.style.display = timerIsActive ? 'none' : 'block';
}

function toggleModal(modal, show) {
    modal.classList.toggle('visible', show);
}