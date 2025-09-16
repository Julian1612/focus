/**
 * Manages the global application state and its persistence in localStorage.
 */

// Default state structure
const defaultState = {
    todos: { vormittag: [], nachmittag: [] },
    routine: [
        {
            title: 'Morgen-Routine: Klarheit & Fokus',
            items: [
                { id: 'mr1', text: 'Tages-Check: Kalender, E-Mails und To-Do\'s', completed: false },
                { id: 'mr2', text: 'Anknüpfen: Erkenntnisse/Notizen von gestern prüfen', completed: false },
                { id: 'mr3', text: 'Zeitblöcke planen: Hinter jede Aufgabe die realistisch geschätzte Zeit eintragen', completed: false },
                { id: 'mr4', text: 'Eat the Frog: Starte direkt mit der wichtigsten oder unangenehmsten Aufgabe', completed: false }
            ]
        },
        {
            title: 'Arbeitsblöcke: Maximale Effizienz',
            items: [
                { id: 'ab1', text: 'Fokus-Soundtrack nutzen', completed: false },
                { id: 'ab2', text: 'Singletasking: Immer nur an EINER Aufgabe arbeiten', completed: false },
                { id: 'ab3', text: 'Bewusste Mikro-Pausen: Nach jedem Sprint 5 Minuten aufstehen', completed: false },
                { id: 'ab4', text: 'Hydriert bleiben', completed: false }
            ]
        },
        {
            title: 'Feierabend-Routine: Abschalten & Vorbereiten',
            items: [
                { id: 'fr1', text: 'Brain-Dump für Morgen: Alle offenen Punkte und Ideen festhalten', completed: false },
                { id: 'fr2', text: 'Clear-Desk: Arbeitsplatz aufräumen für einen klaren Start', completed: false }
            ]
        }
    ],
    plannerEvents: [],
    totalTimeWorked: 0,
    timer: { interval: null, secondsLeft: 1500, isRunning: false, isPaused: false, activeTaskItem: null }
};

export let state = JSON.parse(JSON.stringify(defaultState));

export function loadState() {
    const savedTodos = JSON.parse(localStorage.getItem('focusDashboard_todos'));
    if (savedTodos) {
        savedTodos.vormittag.forEach(t => { if (!t.category) t.category = 'focus'; });
        savedTodos.nachmittag.forEach(t => { if (!t.category) t.category = 'focus'; });
        state.todos = savedTodos;
    }

    const savedRoutine = JSON.parse(localStorage.getItem('focusDashboard_routine'));
    if (savedRoutine && Array.isArray(savedRoutine) && savedRoutine[0]?.title) {
        state.routine = savedRoutine;
    }

    const savedTime = localStorage.getItem('focusDashboard_timeWorked');
    if (savedTime) {
        state.totalTimeWorked = parseInt(savedTime, 10);
    }

    const savedPlannerEvents = JSON.parse(localStorage.getItem('focusDashboard_plannerEvents'));
    if (savedPlannerEvents) {
        savedPlannerEvents.forEach(e => { if (!e.category) e.category = 'focus'; });
        state.plannerEvents = savedPlannerEvents;
    }
}

export function saveState() {
    localStorage.setItem('focusDashboard_todos', JSON.stringify(state.todos));
    localStorage.setItem('focusDashboard_routine', JSON.stringify(state.routine));
    localStorage.setItem('focusDashboard_timeWorked', state.totalTimeWorked.toString());
    localStorage.setItem('focusDashboard_plannerEvents', JSON.stringify(state.plannerEvents));
}

export function resetState() {
    localStorage.clear();
    location.reload();
}