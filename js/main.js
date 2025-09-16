import { state, loadState, saveState, resetState } from './services/stateManager.js';
import { dashboardAPI } from './services/dashboardAPI.js';
import { initAppLoader } from './services/appLoader.js';
import { initUI, updateDailyProgress } from './core/ui.js';
import { initTodo, renderAllTodos } from './core/todo.js';
import { initPlanner, renderPlannerEvents } from './core/planner.js';
import * as timer from './core/timer.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Load state from localStorage
    loadState();

    // 2. Initialize the secure API for apps
    dashboardAPI.init(state, saveState, timer);

    // 3. Define a central render function
    const render = () => {
        renderAllTodos();
        renderPlannerEvents();
        updateDailyProgress();
    };

    // 4. Initialize Core Modules with dependencies
    const dom = {
        sidebar: document.getElementById('app-sidebar'),
        // Add other common DOM elements if needed
    };

    initUI(state, resetState);
    initTodo(state, saveState, render);
    initPlanner(state, saveState, render);
    timer.initTimer(state, saveState, render);
    
    // 5. Initialize the App Loader
    initAppLoader(dom.sidebar, dashboardAPI);
    
    // 6. Initial Render of the application
    render();
    
    console.log("FocusOS initialized successfully.");
});