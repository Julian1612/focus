// File: js/state.js
export const PLANNER_START_HOUR = 7;
export const HOUR_HEIGHT = 60;

export let state = {
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

export let activeSubtaskForm = null;
export function setActiveSubtaskForm(form) {
    activeSubtaskForm = form;
}

export let totalDurationForProgress = 0;
export function setTotalDurationForProgress(duration) {
    totalDurationForProgress = duration;
}

export let plannerAction = { active: false, type: null, target: null, initialY: 0, initialTop: 0, initialHeight: 0 };
export let audioCtx;
export function setAudioCtx(ctx) {
    audioCtx = ctx;
}