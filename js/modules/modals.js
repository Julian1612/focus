// File: js/modules/modals.js
import { $ } from '../utils.js';

const modals = {
    focusFm: $('#modal-focus-fm'),
    routine: $('#modal-routine'),
    focusSession: $('#modal-focus-session')
};

const modalButtons = {
    focusFm: $('#focus-fm-btn'),
    routine: $('#routine-btn'),
    focusSession: $('#focus-session-btn')
};

function toggleModal(modal, show) {
    modal.classList.toggle('visible', show);
}

export function initModalToggles() {
    Object.keys(modalButtons).forEach(key => {
        modalButtons[key].addEventListener('click', () => toggleModal(modals[key], true));
    });

    Object.values(modals).forEach(modal => {
        modal.addEventListener('click', e => {
            if (e.target === modal || e.target.classList.contains('modal-close-btn')) {
                toggleModal(modal, false);
            }
        });
    });
}