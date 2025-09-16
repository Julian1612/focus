/**
 * The single, secure gateway for apps to interact with core state and functions.
 * It provides a stable, read-only interface to core data and safe methods for mutation.
 */

let _state = null;
let _saveStateCallback = null;
let _timerModule = null;

export const dashboardAPI = {
    /**
     * Initializes the API with the core state object and necessary callbacks.
     * @param {object} state - The main application state object.
     * @param {Function} saveState - Callback function to persist the state.
     * @param {object} timer - The core timer module.
     */
    init(state, saveState, timer) {
        _state = state;
        _saveStateCallback = saveState;
        _timerModule = timer;
    },

    /**
     * Retrieves a deep copy of all non-completed todos.
     * @returns {Array<object>} An array of todo objects.
     */
    getActiveTodos() {
        const allTodos = [..._state.todos.vormittag, ..._state.todos.nachmittag];
        return JSON.parse(JSON.stringify(allTodos.filter(t => !t.completed)));
    },

    /**
     * Retrieves a deep copy of the user's routine data.
     * @returns {Array<object>} The routine data structure.
     */
    getRoutine() {
        return JSON.parse(JSON.stringify(_state.routine));
    },

    /**
     * Updates the completion status of a specific routine item.
     * @param {string} itemId - The ID of the routine item to update.
     * @param {boolean} completed - The new completion status.
     */
    updateRoutineItem(itemId, completed) {
        for (const section of _state.routine) {
            const item = section.items.find(i => i.id === itemId);
            if (item) {
                item.completed = completed;
                _saveStateCallback(); // Persist the change
                return;
            }
        }
    },
    
    /**
     * Saves app-specific data to localStorage, namespaced to the app.
     * @param {string} appId - The unique ID of the calling app.
     * @param {string} key - The key for the data.
     * @param {any} value - The value to save (will be JSON stringified).
     */
    saveData(appId, key, value) {
        try {
            const storageKey = `app_${appId}_${key}`;
            localStorage.setItem(storageKey, JSON.stringify(value));
        } catch (error) {
            console.error(`[dashboardAPI] Error saving data for ${appId}:`, error);
        }
    },

    /**
     * Loads app-specific data from localStorage.
     * @param {string} appId - The unique ID of the calling app.
     * @param {string} key - The key for the data.
     * @returns {any} The parsed data, or null if not found or on error.
     */
    loadData(appId, key) {
        try {
            const storageKey = `app_${appId}_${key}`;
            const data = localStorage.getItem(storageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`[dashboardAPI] Error loading data for ${appId}:`, error);
            return null;
        }
    },

    /**
     * Starts the core focus timer for a specific task.
     * @param {string} taskId - The ID of the todo to associate with the timer.
     */
    startTimerForTask(taskId) {
        const allTodos = [..._state.todos.vormittag, ..._state.todos.nachmittag];
        const todo = allTodos.find(t => t.id === taskId);
        const todoItemElement = document.querySelector(`.todo-item[data-id='${taskId}']`);

        if (todo && todoItemElement) {
            // Ensure any existing timer is stopped before starting a new one
            if (_state.timer.isRunning || _state.timer.isPaused) {
                _timerModule.cancelTimer();
            }
            _timerModule.startTimer(todo.time * 60, todoItemElement);
        } else {
            console.warn(`[dashboardAPI] Task with ID "${taskId}" not found.`);
        }
    }
};