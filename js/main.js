// File: js/main.js
import { initModalToggles } from './modules/modals.js';
import { initPlanner, renderPlannerEvents } from './modules/planner.js';
import { initTodo, renderAllTodos, renderCategorySelectors } from './modules/todo.js';
import { initTimer, updateDailyProgress } from './modules/timer.js';
import { initRoutineModal } from './modules/routine.js';
import { $, loadState } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    
    function setGreeting() {
        const greetingElement = $('#greeting');
        const hour = new Date().getHours();
        if (hour < 12) greetingElement.textContent = 'Guten Morgen';
        else if (hour < 18) greetingElement.textContent = 'Guten Tag';
        else greetingElement.textContent = 'Guten Abend';
    }
    
    // This is a special listener to bridge the modules
    document.getElementById('add-todo-category-container').addEventListener('render', renderCategorySelectors);

    // Initial Setup
    setGreeting();
    loadState();
    
    // Initialize all modules
    initModalToggles();
    initPlanner();
    initTodo();
    initTimer();
    initRoutineModal();
    
    // Initial Render
    renderAllTodos();
    renderPlannerEvents();
    updateDailyProgress();
});