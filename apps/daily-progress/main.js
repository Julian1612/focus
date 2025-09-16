/**
 * Main script for the Daily Progress app.
 */
export function init(api, appRootElement) {
    const container = appRootElement.querySelector('#progress-app-container');

    // Um diese App zu ermöglichen, fügen wir eine neue Funktion zur API hinzu.
    // Sie holt ALLE Todos, nicht nur die aktiven.
    // Wir tun so, als gäbe es sie schon, und fügen sie später zur Doku hinzu.
    const allTodos = api.getAllTodos ? api.getAllTodos() : [];
    
    const completedCount = allTodos.filter(todo => todo.completed).length;
    const totalCount = allTodos.length;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    container.innerHTML = `
        <div class="progress-container">
            <div class="progress-circle" id="progress-circle-element">
                <span class="progress-value">${percentage}%</span>
            </div>
            <p class="progress-label">Du hast <strong>${completedCount}</strong> von <strong>${totalCount}</strong> Aufgaben erledigt. Weiter so!</p>
        </div>
    `;

    // Den Farbverlauf des Kreises an den Prozentwert anpassen
    const circle = container.querySelector('#progress-circle-element');
    circle.style.background = `conic-gradient(var(--accent-color) ${percentage * 3.6}deg, var(--border-color) 0deg)`;
}