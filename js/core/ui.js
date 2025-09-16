// --- Constants ---
const CATEGORIES = {
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

// --- Private variables ---
let _state;
let _resetStateCallback;
let audioCtx;

// --- DOM Elements ---
const greetingElement = document.getElementById('greeting');
const form = document.querySelector('.add-todo-form');
const plannerInputModal = document.getElementById('planner-input-modal');

// --- Initialization ---
export function initUI(state, resetStateCallback) {
    _state = state;
    _resetStateCallback = resetStateCallback;
    setGreeting();
    renderCategorySelectors();
    addEventListeners();
}

// --- Functions ---
function setGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) greetingElement.textContent = 'Guten Morgen';
    else if (hour < 18) greetingElement.textContent = 'Guten Tag';
    else greetingElement.textContent = 'Guten Abend';
}

export function renderCategorySelectors() {
    const containers = [
        document.getElementById('add-todo-category-container'),
        document.getElementById('planner-input-category-container')
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

    const textInput = container.closest('.input-modal-overlay') 
        ? plannerInputModal.querySelector('#planner-input-text') 
        : form.querySelector('input[type="text"]');
    
    if (activeCategoryKey === 'pause') {
        textInput.value = 'Pause';
        textInput.disabled = true;
    } else {
        if (textInput.value === 'Pause') textInput.value = '';
        textInput.disabled = false;
    }
}

export function playSound() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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

export function formatMinutesToHours(minutes) {
    if (isNaN(minutes) || minutes === 0) return '0m';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    let result = '';
    if (h > 0) result += `${h}h `;
    if (m > 0) result += `${m}m`;
    return result.trim();
}

export function updateDailyProgress() {
    const allTasks = [..._state.todos.vormittag, ..._state.todos.nachmittag];
    const totalTimeOfAllTasks = allTasks.reduce((sum, t) => sum + t.time, 0);
    const workedTime = _state.totalTimeWorked;

    const workedTimeFormatted = formatMinutesToHours(workedTime);
    const totalTimeFormatted = formatMinutesToHours(totalTimeOfAllTasks);

    document.getElementById('progress-time').textContent = `${workedTimeFormatted} / ${totalTimeFormatted}`;
    
    const percentage = totalTimeOfAllTasks > 0 ? (workedTime / totalTimeOfAllTasks) * 100 : 0;
    document.getElementById('daily-progress-bar').style.width = `${Math.min(percentage, 100)}%`;
    document.getElementById('header-progress-bar').style.width = `${Math.min(percentage, 100)}%`;
}

function addEventListeners() {
    document.body.addEventListener('click', handleCategoryClick);
    document.getElementById('new-day-btn').addEventListener('click', () => {
        if (confirm("Möchten Sie wirklich alle Daten zurücksetzen und einen neuen Tag beginnen?")) {
            _resetStateCallback();
        }
    });
}