// File: js/modules/routine.js
import { state } from '../state.js';
import { $, saveState } from '../utils.js';

const routineListElement = $('#routine-list');

function renderRoutineList() {
    routineListElement.innerHTML = '';
    state.routine.forEach(section => {
        const h3 = document.createElement('h3');
        h3.textContent = section.title;
        routineListElement.appendChild(h3);
        section.items.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<input type="checkbox" id="${item.id}" ${item.completed ? 'checked' : ''}><label for="${item.id}">${item.text}</label>`;
            routineListElement.appendChild(li);
        });
    });
}

function handleRoutineCheckboxChange(e) {
    const target = e.target;
    if (target.type !== 'checkbox' || !target.closest('#routine-list li')) return;

    let foundItem = null;
    for (const section of state.routine) {
        const item = section.items.find(i => i.id === target.id);
        if (item) {
            foundItem = item;
            break;
        }
    }
    if (foundItem) {
        foundItem.completed = target.checked;
        saveState();
    }
}

export function initRoutineModal() {
    renderRoutineList();
    routineListElement.addEventListener('change', handleRoutineCheckboxChange);
}