/**
 * js/main.js
 * * Haupt-Einstiegspunkt der Anwendung.
 * - Importiert alle Module
 * - Definiert und verwaltet den globalen Zustand
 * - Verteilt Events an die zuständigen Module
 * - Orchestriert das Rendering der UI
 */

import { state, CATEGORIES, ICONS } from './state.js';
import { playSound, formatMinutesToHours } from './utils.js';
import { initModals } from './modules/modals.js';
import { initRoutine, renderRoutineList, handleRoutineCheckboxChange } from './modules/routine.js';
// Platzhalter für weitere Modul-Imports
// import { initTodos, ... } from './modules/todo.js';
// import { initPlanner, ... } from './modules/planner.js';
// import { initTimer, ... } from './modules/timer.js';

// --- DOM-ELEMENTE SAMMELN (Einmalig für bessere Performance) ---
const dom = {
    greeting: document.getElementById('greeting'),
    headerProgressBar: document.getElementById('header-progress-bar'),
    progressTimeDisplay: document.getElementById('progress-time'),
    dailyProgressBar: document.getElementById('daily-progress-bar'),
    newDayButton: document.getElementById('new-day-btn'),
    globalStartNextBtn: document.getElementById('global-start-next-btn'),
    
    // Modals
    modals: {
        focusFm: document.getElementById('modal-focus-fm'),
        routine: document.getElementById('modal-routine'),
        focusSession: document.getElementById('modal-focus-session')
    },
    modalButtons: {
        focusFm: document.getElementById('focus-fm-btn'),
        routine: document.getElementById('routine-btn'),
        focusSession: document.getElementById('focus-session-btn')
    },

    // Routine
    routineList: document.getElementById('routine-list'),

    // To-Do (Beispiele - würde in todo.js-Implementierung vervollständigt)
    addTodoForm: document.querySelector('.add-todo-form'),
    todoListContainer: document.getElementById('list-all-todos'),
    
    // Planner (Beispiele)
    plannerGrid: document.querySelector('.planner-grid'),
    
    // Timer (Beispiele)
    timerDisplay: document.getElementById('timer-display'),
};

// --- ZUSTANDSVERWALTUNG ---

function saveState() {
    localStorage.setItem('focusDashboard_todos', JSON.stringify(state.todos));
    localStorage.setItem('focusDashboard_routine', JSON.stringify(state.routine));
    localStorage.setItem('focusDashboard_timeWorked', state.totalTimeWorked);
    localStorage.setItem('focusDashboard_plannerEvents', JSON.stringify(state.plannerEvents));
}

function loadState() {
    const savedTodosData = JSON.parse(localStorage.getItem('focusDashboard_todos'));
    if (savedTodosData) {
        // Migration für alte Daten ohne Kategorie
        (savedTodosData.vormittag || []).forEach(t => { if (!t.category) t.category = 'focus'; });
        (savedTodosData.nachmittag || []).forEach(t => { if (!t.category) t.category = 'focus'; });
        state.todos = savedTodosData;
    }

    const savedRoutine = JSON.parse(localStorage.getItem('focusDashboard_routine'));
    if (savedRoutine && savedRoutine[0]?.items[0]?.indent !== undefined) {
        state.routine = savedRoutine;
    }

    state.totalTimeWorked = parseInt(localStorage.getItem('focusDashboard_timeWorked') || '0', 10);

    const savedPlannerEvents = JSON.parse(localStorage.getItem('focusDashboard_plannerEvents'));
    if (savedPlannerEvents) {
        savedPlannerEvents.forEach(e => { if (!e.category) e.category = 'focus'; });
        state.plannerEvents = savedPlannerEvents;
    }
}

// --- RENDER-FUNKTIONEN ---

function renderAll() {
    renderRoutineList();
    // renderAllTodos(); // Würde von todo.js importiert
    // renderPlannerEvents(); // Würde von planner.js importiert
    updateDailyProgress();
}

function updateDailyProgress() {
    const allTasks = [...state.todos.vormittag, ...state.todos.nachmittag];
    const totalTime = allTasks.reduce((sum, t) => sum + t.time, 0);
    const workedTime = state.totalTimeWorked;

    dom.progressTimeDisplay.textContent = `${formatMinutesToHours(workedTime)} / ${formatMinutesToHours(totalTime)}`;
    const percentage = totalTime > 0 ? (workedTime / totalTime) * 100 : 0;
    
    const safePercentage = Math.min(percentage, 100);
    dom.dailyProgressBar.style.width = `${safePercentage}%`;
    dom.headerProgressBar.style.width = `${safePercentage}%`;
}


// --- EVENT HANDLING ---

function addEventListeners() {
    // Globaler Event-Listener für Checkboxen
    document.body.addEventListener('change', e => {
        if (e.target.type !== 'checkbox') return;

        let stateChanged = false;
        
        const routineLi = e.target.closest('#routine-list li');
        if (routineLi) {
            stateChanged = handleRoutineCheckboxChange(e.target);
        }

        // Hier kämen die Handler für To-Do-Checkboxes etc.
        // const todoItem = e.target.closest('.todo-item');
        // if(todoItem) { stateChanged = handleTodoCheckboxChange(...) }

        if (stateChanged) {
            saveState();
            renderAll(); // Oder gezielteres Rendering
        }
    });

    dom.newDayButton.addEventListener('click', () => {
        if (confirm("Bist du sicher, dass du einen neuen Tag starten und alle Daten zurücksetzen möchtest?")) {
            localStorage.clear();
            location.reload();
        }
    });
}


// --- INITIALISIERUNG ---

function setGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) dom.greeting.textContent = 'Guten Morgen';
    else if (hour < 18) dom.greeting.textContent = 'Guten Tag';
    else dom.greeting.textContent = 'Guten Abend';
}

function init() {
    // 1. Zustand laden
    loadState();
    
    // 2. UI initialisieren
    setGreeting();

    // 3. Module initialisieren (Abhängigkeiten übergeben)
    initModals({ modals: dom.modals, modalButtons: dom.modalButtons });
    initRoutine(dom.routineList, state);
    // initTodos(...);
    // initPlanner(...);
    // initTimer(...);

    // 4. Event Listeners hinzufügen
    addEventListeners();
    
    // 5. Alles initial rendern
    renderAll();
}

// App starten, sobald das DOM bereit ist
document.addEventListener('DOMContentLoaded', init);