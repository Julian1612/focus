/**
 * Daily Ritual - Glassmorphism Board for FocusOS
 */

const mockDashboardApi = {
    saveData(appId, key, value) {
        localStorage.setItem(`${appId}_${key}`, JSON.stringify(value));
    },
    loadData(appId, key) {
        const data = localStorage.getItem(`${appId}_${key}`);
        return data ? JSON.parse(data) : null;
    }
};

const APP_ID = 'daily-ritual';

const RITUAL_STRUCTURE = [
    {
        id: 'morning', title: 'Morning Routine',
        items: [
            { id: 'morning-calendar', text: 'Scan Calendar' }, { id: 'morning-emails', text: 'Process Inbox' },
            { id: 'morning-todos', text: 'Review Directives' }, { id: 'morning-review', text: 'Analyze Yesterday\'s Data' },
            { id: 'morning-plan', text: 'Allocate Time Blocks' }, { id: 'morning-frog', text: 'Execute Priority Task' }
        ]
    },
    {
        id: 'workday', title: 'Work Blocks',
        items: [
            { id: 'work-soundtrack', text: 'Engage Focus Soundtrack' }, { id: 'work-breaks', text: 'Execute Micro-Breaks' },
            { id: 'work-hydrate', text: 'Maintain Hydration' }
        ]
    },
    {
        id: 'evening', title: 'Evening Routine',
        items: [
            { id: 'evening-dump', text: 'Data Dump for Next Cycle' }, { id: 'evening-desk', text: 'Clear Workspace' }
        ]
    }
];

let state = { checkedItems: [], date: null };
let dashboardApi = mockDashboardApi;
let appRootElement = null;

function init(api, rootEl) {
    dashboardApi = api;
    appRootElement = rootEl;
    if (!appRootElement) return;

    loadState();
    renderBoard();
    addEventListeners();
    updateUI();
}

function renderBoard() {
    let boardHtml = `<div class="routine-board">`;

    RITUAL_STRUCTURE.forEach(routine => {
        boardHtml += `
            <div class="routine-card" data-routine-id="${routine.id}">
                <div class="card-header">
                    <h3>${routine.title}</h3>
                    <div class="progress-bar">
                        <div class="progress-bar-fill"></div>
                    </div>
                </div>
                <ul class="task-list">
                    ${routine.items.map(item => `
                        <li class="task-item" data-item-id="${item.id}">
                            <div class="custom-checkbox">
                                <svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                            <span class="task-label">${item.text}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    });

    boardHtml += `</div>`;
    appRootElement.innerHTML = boardHtml;
}

function addEventListeners() {
    appRootElement.addEventListener('click', (e) => {
        const taskItem = e.target.closest('.task-item');
        if (taskItem) {
            const itemId = taskItem.dataset.itemId;
            const isChecked = state.checkedItems.includes(itemId);

            if (isChecked) {
                state.checkedItems = state.checkedItems.filter(id => id !== itemId);
            } else {
                state.checkedItems.push(itemId);
            }
            
            saveState();
            updateUI();
        }
    });
}

function loadState() {
    const today = new Date().toISOString().slice(0, 10);
    const savedState = dashboardApi.loadData(APP_ID, 'ritualState');

    if (savedState && savedState.date === today) {
        state = savedState;
    } else {
        state = { checkedItems: [], date: today };
        saveState();
    }
}

function saveState() {
    dashboardApi.saveData(APP_ID, 'ritualState', state);
}

function updateUI() {
    let isFirstIncompleteCard = true;
    RITUAL_STRUCTURE.forEach(routine => {
        const cardEl = appRootElement.querySelector(`.routine-card[data-routine-id="${routine.id}"]`);
        if (!cardEl) return;

        const totalItems = routine.items.length;
        let completedCount = 0;

        routine.items.forEach(item => {
            const itemEl = cardEl.querySelector(`.task-item[data-item-id="${item.id}"]`);
            const isChecked = state.checkedItems.includes(item.id);
            if (itemEl) {
                itemEl.classList.toggle('is-completed', isChecked);
                if (isChecked) completedCount++;
            }
        });

        const progress = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;
        const progressBarFill = cardEl.querySelector('.progress-bar-fill');
        if (progressBarFill) {
            progressBarFill.style.width = `${progress}%`;
        }

        if (progress < 100 && isFirstIncompleteCard) {
            cardEl.classList.add('is-active');
            isFirstIncompleteCard = false;
        } else {
            cardEl.classList.remove('is-active');
        }
    });
}

const rootElement = document.getElementById('daily-ritual-root');
init(mockDashboardApi, rootElement);