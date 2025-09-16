// File: js/modules/timer.js
import { state, setTotalDurationForProgress, totalDurationForProgress } from '../state.js';
import { $, ICONS, formatMinutesToHours, saveState } from '../utils.js';
import { renderAllTodos } from './todo.js';

const timerDisplay = $('#timer-display');
const globalTimerDisplay = $('#global-timer-display');
const timerControlButton = $('#timer-control-btn');
const timerCancelButton = $('#timer-cancel-btn');
const newDayButton = $('#new-day-btn');
const dailyProgressBar = $('#daily-progress-bar');
const headerProgressBar = $('#header-progress-bar');
const progressTimeDisplay = $('#progress-time');
const startNextTaskBtn = $('#start-next-task-btn');
const globalStartNextBtn = $('#global-start-next-btn');
const modalFocusSessionBtn = $('#focus-session-btn');
const timerProgressBand = $('#timer-progress-band');

function updateTimerUI() {
    const minutes = Math.floor(Math.max(0, state.timer.secondsLeft) / 60);
    const seconds = Math.max(0, state.timer.secondsLeft) % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    timerDisplay.textContent = display;
    globalTimerDisplay.textContent = display;
    if (state.timer.isRunning || state.timer.isPaused) {
        document.title = `${display} - Fokus Dashboard`;
    }
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

export function updateFocusSessionView() {
    const timerIsActive = state.timer.isRunning || state.timer.isPaused;
    timerDisplay.style.display = timerIsActive ? 'block' : 'none';
    startNextTaskBtn.style.display = timerIsActive ? 'none' : 'block';
    $('.timer-controls').style.display = timerIsActive ? 'flex' : 'none';
}

export function updateGlobalControlsView() {
    const timerIsActive = state.timer.isRunning || state.timer.isPaused;
    globalTimerDisplay.style.display = timerIsActive ? 'block' : 'none';
    timerProgressBand.style.display = timerIsActive ? 'block' : 'none';
    globalStartNextBtn.style.display = timerIsActive ? 'none' : 'block';
}

function resetTimerState() {
    if (state.timer.activeTaskItem) {
        state.timer.activeTaskItem.classList.remove('timer-active');
        state.timer.activeTaskItem.querySelector('.task-timer-btn').innerHTML = ICONS.play;
    }
    state.timer.isRunning = false;
    state.timer.isPaused = false;
    state.timer.interval = null;
    state.timer.activeTaskItem = null;
    state.timer.secondsLeft = 1500;
    updateTimerUI();
    modalFocusSessionBtn.classList.remove('active');
    document.querySelectorAll('.task-timer-btn').forEach(btn => btn.innerHTML = ICONS.play);
    document.title = 'Fokus Dashboard';
    updateFocusSessionView();
    updateGlobalControlsView();
}

function togglePauseTimer() {
    if (!state.timer.activeTaskItem) return;
    state.timer.isPaused = !state.timer.isPaused;
    if (state.timer.isPaused) {
        state.timer.isRunning = false;
        clearInterval(state.timer.interval);
        timerControlButton.textContent = 'Fortsetzen';
        state.timer.activeTaskItem.querySelector('.task-timer-btn').innerHTML = ICONS.play;
    } else {
        state.timer.isRunning = true;
        state.timer.interval = setInterval(updateTimer, 1000);
        timerControlButton.textContent = 'Pause';
        state.timer.activeTaskItem.querySelector('.task-timer-btn').innerHTML = ICONS.pause;
    }
    updateGlobalControlsView();
}

// THIS FUNCTION IS NOW EXPORTED
export function cancelTimer() {
    clearInterval(state.timer.interval);
    resetTimerState();
}

export function startTimer(duration, taskItem) {
    if (state.timer.isRunning || state.timer.isPaused) return;
    setTotalDurationForProgress(duration);
    timerProgressBand.style.background = `conic-gradient(var(--accent-color) 360deg, transparent 360deg)`;
    state.timer.secondsLeft = duration;
    state.timer.isRunning = true;
    state.timer.isPaused = false;
    if (state.timer.activeTaskItem) {
        state.timer.activeTaskItem.classList.remove('timer-active');
    }
    const currentlyActive = $('.todo-item.timer-active');
    if (currentlyActive) {
        currentlyActive.classList.remove('timer-active');
    }
    taskItem.classList.add('timer-active');
    taskItem.querySelector('.task-timer-btn').innerHTML = ICONS.pause;
    state.timer.activeTaskItem = taskItem;
    state.timer.interval = setInterval(updateTimer, 1000);
    updateTimerUI();
    modalFocusSessionBtn.classList.add('active');
    updateFocusSessionView();
    updateGlobalControlsView();
}

export function updateDailyProgress() {
    const allTasks = [...state.todos.vormittag, ...state.todos.nachmittag];
    const totalTimeOfAllTasks = allTasks.reduce((sum, t) => sum + t.time, 0);
    const workedTime = state.totalTimeWorked;
    const workedTimeFormatted = formatMinutesToHours(workedTime);
    const totalTimeFormatted = formatMinutesToHours(totalTimeOfAllTasks);
    progressTimeDisplay.textContent = `${workedTimeFormatted} / ${totalTimeFormatted}`;
    const percentage = totalTimeOfAllTasks > 0 ? (workedTime / totalTimeOfAllTasks) * 100 : 0;
    dailyProgressBar.style.width = `${Math.min(percentage, 100)}%`;
    headerProgressBar.style.width = `${Math.min(percentage, 100)}%`;
}

function startNextTask() {
    const allTasks = [...state.todos.vormittag, ...state.todos.nachmittag];
    const nextTodo = allTasks.find(t => !t.completed);
    if (nextTodo) {
        const todoItemElement = $(`.todo-item[data-id='${nextTodo.id}']`);
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

function handleNewDay() {
    if (confirm('Möchten Sie wirklich alle Daten zurücksetzen und einen neuen Tag beginnen?')) {
        localStorage.clear();
        location.reload();
    }
}

export function initTimer() {
    timerControlButton.addEventListener('click', togglePauseTimer);
    timerCancelButton.addEventListener('click', cancelTimer);
    newDayButton.addEventListener('click', handleNewDay);
    startNextTaskBtn.addEventListener('click', startNextTask);
    globalStartNextBtn.addEventListener('click', startNextTask);
    updateDailyProgress();
    updateFocusSessionView();
    updateGlobalControlsView();
}