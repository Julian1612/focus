/**
 * js/state.js
 * * Enthält den zentralen Anwendungszustand (Single Source of Truth).
 * Alle Daten, die die Anwendung steuern, sind hier gespeichert.
 */

export const CATEGORIES = {
    focus: { name: 'Focus', color: '#af52de' },
    meeting: { name: 'Meeting', color: '#5e5ce6' },
    privat: { name: 'Privat', color: '#32d74b' },
    pause: { name: 'Pause', color: '#ff9f0a' },
    orga: { name: 'Organisation', color: '#64d2ff' }
};

export const ICONS = {
    play: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>',
    pause: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25v13.5m-6-13.5v13.5" /></svg>'
};

export let state = {
    todos: { vormittag: [], nachmittag: [] },
    routine: [
        {
            title: 'Morgen-Routine: Klarheit & Fokus',
            items: [
                { id: 'mr1', text: 'Tages-Check:', type: 'heading' },
                { id: 'mr2', text: 'Kalender', completed: false, indent: true },
                { id: 'mr3', text: 'E-Mails', completed: false, indent: true },
                { id: 'mr4', text: 'To-Do\'s', completed: false, indent: true },
                { id: 'mr5', text: 'Anknüpfen: Erkenntnisse/Notizen von gestern prüfen.', completed: false },
                { id: 'mr6', text: 'Eat the Frog.', completed: false }
            ]
        },
        {
            title: 'Arbeitsblöcke: Maximale Effizienz',
            items: [
                 { id: 'ab1', text: 'Fokus-Soundtrack nutzen', completed: false },
                 { id: 'ab2', text: 'Hydriert bleiben', completed: false },
                 { id: 'ab3', text: 'Bewusste Mikro-Pausen: Nach jedem Sprint 5 Minuten aufstehen, strecken, Wasser trinken.', completed: false }
            ]
        },
        {
            title: 'Feierabend-Routine: Abschalten & Vorbereiten',
            items: [
                { id: 'fr1', text: 'Brain-Dump für Morgen: Alle offenen Punkte und Ideen festhalten', completed: false },
                { id: 'fr2', text: 'Clear-Desk: Arbeitsplatz aufräumen/Tasche packen.', completed: false }
            ]
        }
    ],
    plannerEvents: [],
    totalTimeWorked: 0,
    timer: { interval: null, secondsLeft: 1500, isRunning: false, isPaused: false, activeTaskItem: null, totalDuration: 1500 }
};