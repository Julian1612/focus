/**
 * js/modules/routine.js
 * * Verwaltet die Anzeige und Interaktion mit der "Meine Routine"-Liste.
 */

let routineListElement;
let appState;

export function initRoutine(element, state) {
    routineListElement = element;
    appState = state;
}

export function renderRoutineList() {
    if (!routineListElement) return;
    routineListElement.innerHTML = '';
    appState.routine.forEach(section => {
        const h3 = document.createElement('h3');
        h3.textContent = section.title;
        routineListElement.appendChild(h3);
        section.items.forEach(item => {
            if (item.type === 'heading') {
                const headingSpan = document.createElement('span');
                headingSpan.className = 'routine-heading';
                headingSpan.textContent = item.text;
                routineListElement.appendChild(headingSpan);
            } else {
                const li = document.createElement('li');
                if (item.indent) {
                    li.classList.add('indented');
                }
                li.innerHTML = `<input type="checkbox" id="${item.id}" ${item.completed ? 'checked' : ''}><label for="${item.id}">${item.text}</label>`;
                routineListElement.appendChild(li);
            }
        });
    });
}

export function handleRoutineCheckboxChange(target) {
    let foundItem = null;
    for (const section of appState.routine) {
        const item = section.items.find(i => i.id === target.id);
        if (item) {
            foundItem = item;
            break;
        }
    }
    if (foundItem) {
        foundItem.completed = target.checked;
        return true; // Signalisiert, dass eine Zustandsänderung stattgefunden hat
    }
    return false;
}