// File: js/utils.js
import { state, setAudioCtx, audioCtx } from './state.js';

export const $ = selector => document.querySelector(selector);
export const $$ = selector => document.querySelectorAll(selector);

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

export function loadState() {
    const savedTodosData = JSON.parse(localStorage.getItem('focusDashboard_todos'));
    if (savedTodosData) {
        savedTodosData.vormittag.forEach(t => { if (!t.category) t.category = 'focus'; });
        savedTodosData.nachmittag.forEach(t => { if (!t.category) t.category = 'focus'; });
        state.todos = savedTodosData;
    }
    const savedRoutine = JSON.parse(localStorage.getItem('focusDashboard_routine'));
    if (savedRoutine && Array.isArray(savedRoutine) && savedRoutine[0]?.title) {
        state.routine = savedRoutine;
    }
    const savedTime = localStorage.getItem('focusDashboard_timeWorked');
    if (savedTime) state.totalTimeWorked = parseInt(savedTime, 10);
    const savedPlannerEvents = JSON.parse(localStorage.getItem('focusDashboard_plannerEvents'));
    if (savedPlannerEvents) {
        savedPlannerEvents.forEach(e => { if (!e.category) e.category = 'focus'; });
        state.plannerEvents = savedPlannerEvents;
    }
}

export function saveState() {
    localStorage.setItem('focusDashboard_todos', JSON.stringify(state.todos));
    localStorage.setItem('focusDashboard_routine', JSON.stringify(state.routine));
    localStorage.setItem('focusDashboard_timeWorked', state.totalTimeWorked);
    localStorage.setItem('focusDashboard_plannerEvents', JSON.stringify(state.plannerEvents));
}

export function formatMinutesToHours(minutes) {
    if (isNaN(minutes) || minutes === 0) return '0m';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    let result = '';
    if (h > 0) result += `${h}h `;
    if (m > 0) result += `${m}m`;
    return result.trim();
}

export function playSound() {
    if (!audioCtx) setAudioCtx(new (window.AudioContext || window.webkitAudioContext)());
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
    oscillator.stop(audioCtx.currentTime + 0.5);
}