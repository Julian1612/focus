export async function init(api, appRootElement) {

    // --- STATE MANAGEMENT & CONFIG ---
    const columns = {
        inbox: "📥 Eingang", today: "🎯 Heute", week: "🗓️ Diese Woche",
        paused: "⏸️ Pausiert / Delegiert", someday: "🤔 Vielleicht / Irgendwann"
    };

    const labelConfig = {
        'Focus': 'label-focus', 'Meeting': 'label-meeting', 'Privat': 'label-privat',
        'Organisation': 'label-organisation'
    };

    const getTodayISO = () => new Date().toLocaleDateString('en-CA');

    const getInitialTasks = async () => {
        const savedTasks = await api.loadData('gtd-board', 'tasks');
        if (savedTasks && Object.keys(savedTasks).length > 0) return savedTasks;
        
        return {
            inbox: [{ id: `task-${Date.now() + 1}`, content: 'Wöchentliches Team-Sync planen', dueDate: null, label: 'Meeting', subtasks: [], notes: "" }],
            today: [
                { id: `task-${Date.now() + 2}`, content: 'Präsentation fertigstellen', dueDate: getTodayISO(), label: 'Focus', subtasks: [{text: 'Feedback einarbeiten', done: true}, {text: 'Zahlen prüfen', done: false}], notes: "Final check required." },
                { id: `task-${Date.now() + 3}`, content: 'Arzttermin vereinbaren', dueDate: getTodayISO(), label: 'Privat', subtasks: [], notes: "" },
            ],
            week: [{ id: `task-${Date.now() + 6}`, content: 'Reise buchen', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA'), label: 'Organisation', subtasks: [], notes: "" }],
            paused: [],
            someday: [{ id: `task-${Date.now() + 5}`, content: 'Neues Hobby lernen', dueDate: null, label: 'Privat', subtasks: [], notes: "" }]
        };
    };
    
    let tasks = await getInitialTasks();
    
    // --- NEW: Function to publish tasks for the daily planner ---
    const publishTodayTasks = () => {
        const todayTasks = tasks.today || [];
        // We create a clean data structure for other apps
        const payload = todayTasks.map(task => ({
            id: `gtd-${task.id}`, // Prefix to avoid ID conflicts
            title: task.content,
            source: 'GTD Board'
        }));
        
        // Publish the event via the API
        api.publish('planner:add-tasks', payload);
    };

    // --- MODIFIED: saveTasks now also calls the publisher ---
    const saveTasks = () => {
        api.saveData('gtd-board', 'tasks', tasks);
        publishTodayTasks(); // Trigger the update for the planner
    };
    
    // --- CORE LOGIC ---
    const autoSortTasksByDate = () => {
        const today = getTodayISO();
        let tasksMoved = false;
        Object.keys(tasks).forEach(columnId => {
            if (columnId === 'today') return;
            const tasksToMove = [];
            tasks[columnId].forEach(task => {
                if (task.dueDate === today) {
                    tasksToMove.push(task);
                }
            });

            if (tasksToMove.length > 0) {
                tasks[columnId] = tasks[columnId].filter(task => !tasksToMove.find(t => t.id === task.id));
                tasks.today = [...tasks.today, ...tasksToMove];
                tasksMoved = true;
            }
        });
        if (tasksMoved) {
            console.log("GTD Board: Tasks automatically moved to 'Today' column.");
        }
    };

    // ... (rest of the file remains unchanged)

    // --- EVENT HANDLING & ACTIONS ---
    const addEventListeners = () => {
        appRootElement.querySelector('#add-task-form')?.addEventListener('submit', handleAddTask);
        
        board.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="delete"]')) handleDeleteTask(e);
            else if (e.target.closest('[data-task-id]')) openEditModal(e);
        });

        board.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) { e.preventDefault(); board.scrollLeft += e.deltaY; }
        });

        appRootElement.querySelectorAll('[draggable="true"]').forEach(d => {
            d.addEventListener('dragstart', handleDragStart);
            d.addEventListener('dragend', handleDragEnd);
        });

        appRootElement.querySelectorAll('[data-role="tasks-container"]').forEach(c => {
            c.addEventListener('dragover', handleDragOver);
            c.addEventListener('dragleave', handleDragLeave);
            c.addEventListener('drop', handleDrop);
        });
    };

    // ... (rest of the file remains unchanged)

    // --- INITIALIZE APP ---
    autoSortTasksByDate(); // Sort first
    saveTasks(); // This will save and do the initial publish
    renderBoard();
}