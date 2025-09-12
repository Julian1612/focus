/**
 * js/modules/modals.js
 * * Verwaltet das Öffnen und Schließen aller Modals.
 */

// DOM-Elemente, die in main.js abgefragt und hierher übergeben werden
let elements = {};

function toggleModal(modal, show) {
    modal.classList.toggle('visible', show);
}

export function initModals(modalElements) {
    elements = modalElements;

    Object.keys(elements.modalButtons).forEach(key => {
        elements.modalButtons[key].addEventListener('click', () => toggleModal(elements.modals[key], true));
    });

    Object.values(elements.modals).forEach(modal => {
        modal.addEventListener('click', e => {
            if (e.target === modal || e.target.classList.contains('modal-close-btn')) {
                toggleModal(modal, false);
            }
        });
    });
}