/**
 * The single, secure gateway for apps to interact with core state and functions.
 * It provides a stable, read-only interface to core data and safe methods for mutation.
 */

let _state = null;
let _saveStateCallback = null;
let _timerModule = null;

// NEW: Store for event listeners (subscribers)
const _subscribers = {};

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

    // --- NEW: Publish/Subscribe System ---

    /**
     * Publishes an event to all subscribed listeners.
     * @param {string} eventName - The name of the event (e.g., 'planner:add-tasks').
     * @param {any} data - The data payload to send with the event.
     */
    publish(eventName, data) {
        if (!_subscribers[eventName]) {
            return;
        }
        console.log(`[dashboardAPI] Publishing event: ${eventName}`, data);
        _subscribers[eventName].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`[dashboardAPI] Error in subscriber for event ${eventName}:`, error);
            }
        });
    },

    /**
     * Subscribes to an event.
     * @param {string} eventName - The name of the event to listen for.
     * @param {Function} callback - The function to execute when the event is published.
     * @returns {Function} An unsubscribe function to remove the listener.
     */
    subscribe(eventName, callback) {
        if (!_subscribers[eventName]) {
            _subscribers[eventName] = [];
        }
        _subscribers[eventName].push(callback);
        console.log(`[dashboardAPI] New subscription for event: ${eventName}`);

        // Return an unsubscribe function
        return () => {
            _subscribers[eventName] = _subscribers[eventName].filter(cb => cb !== callback);
        };
    },

    // --- Existing API Methods ---

    getActiveTodos() { /* ... unchanged ... */ },
    getRoutine() { /* ... unchanged ... */ },
    updateRoutineItem(itemId, completed) { /* ... unchanged ... */ },
    saveData(appId, key, value) { /* ... unchanged ... */ },
    loadData(appId, key) { /* ... unchanged ... */ },
    startTimerForTask(taskId) { /* ... unchanged ... */ },
};