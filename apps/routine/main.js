/**
 * Main script for Meine Routine App.
 * It fetches routine data via the API, renders it, and handles updates.
 */
let dashboardAPI = null;

function renderRoutineList(routineData, rootEl) {
    const routineListElement = rootEl.querySelector('#routine-list-app');
    if (!routineListElement) return;
    
    routineListElement.innerHTML = '';
    routineData.forEach(section => {
        const h3 = document.createElement('h3');
        h3.textContent = section.title;
        routineListElement.appendChild(h3);
        section.items.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <input type="checkbox" id="app-routine-${item.id}" data-id="${item.id}" ${item.completed ? 'checked' : ''}>
                <label for="app-routine-${item.id}">${item.text}</label>
            `;
            routineListElement.appendChild(li);
        });
    });
}

function handleCheckboxChange(event) {
    if (event.target.type === 'checkbox' && dashboardAPI) {
        const itemId = event.target.dataset.id;
        const isChecked = event.target.checked;
        dashboardAPI.updateRoutineItem(itemId, isChecked);
    }
}

export function init(api, appRootElement) {
    dashboardAPI = api;
    const routineData = dashboardAPI.getRoutine();
    
    renderRoutineList(routineData, appRootElement);

    const listElement = appRootElement.querySelector('#routine-list-app');
    listElement.removeEventListener('change', handleCheckboxChange); // Prevent duplicate listeners
    listElement.addEventListener('change', handleCheckboxChange);
    
    console.log("Meine Routine App loaded.");
}