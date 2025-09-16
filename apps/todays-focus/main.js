/**
 * Main script for the "Today's Focus" App.
 */
export function init(api, appRootElement) {
    const container = appRootElement.querySelector('#focus-task-container');

    // 1. Use the API to get a safe copy of the active to-do list
    const activeTodos = api.getActiveTodos();

    if (activeTodos.length > 0) {
        // 2. Identify the very next task
        const nextTask = activeTodos[0];
        
        // 3. Render the task information
        container.innerHTML = `
            <div class="focus-task-card">
                <h3>${nextTask.text}</h3>
                <p>Scheduled for ${nextTask.time} minutes.</p>
                <button id="start-focus-btn" data-task-id="${nextTask.id}">
                    Start Focus Session
                </button>
            </div>
        `;

        // 4. Add a click listener for our new button
        const startButton = container.querySelector('#start-focus-btn');
        startButton.addEventListener('click', () => {
            const taskId = startButton.dataset.taskId;
            
            // 5. Use the API to tell the core timer to start
            api.startTimerForTask(taskId);

            // 6. (Optional) Close the modal after starting the timer
            appRootElement.closest('.modal-overlay').classList.remove('visible');
        });

    } else {
        // Display a friendly message if there are no tasks
        container.innerHTML = `
            <div class="focus-task-card">
                <h3>All Done! ✅</h3>
                <p>You've completed all your tasks for today. Great job!</p>
            </div>
        `;
    }
}