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

    // --- NEW: Connect the Planner to the GTD Board via the API ---
    // This is the central point where we link events to actions.
    dashboardAPI.subscribe('planner:add-tasks', (tasksFromGtd) => {
        // Ensure the planner state exists
        if (!state.planner || !Array.isArray(state.planner.events)) {
            state.planner = { events: [] };
        }
        
        // 1. Remove any old tasks that came from the GTD Board to avoid duplicates
        state.planner.events = state.planner.events.filter(event => event.source !== 'GTD Board');
        
        // 2. Transform and add the new tasks from the GTD board
        const plannerEvents = tasksFromGtd.map(task => ({
            id: task.id, // Use the prefixed ID from the GTD board
            title: task.title,
            time: "Ganztägig", // Or derive from task if available
            type: 'task',
            source: 'GTD Board' // Mark the source for easy filtering
        }));
        
        state.planner.events.push(...plannerEvents);
        
        // 3. Save the updated state and re-render the UI
        saveState();
        renderPlannerEvents(); 
    });


    // 3. Define a central render function
    const render = () => {
        renderAllTodos();
        renderPlannerEvents();
        updateDailyProgress();
    };

    // 4. Initialize Core Modules with dependencies
    const dom = {
        sidebar: document.getElementById('app-sidebar'),
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