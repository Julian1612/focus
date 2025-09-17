/**
 * Dynamically discovers and loads apps from the /apps/ directory.
 * This version uses import.meta.url to create robust, portable paths.
 */

// In a real backend scenario, this list would be fetched from the server.
const APP_DIRECTORIES = ['focus-fm', 'routine', 'notes', 'todays-focus', 'gtd-board'];

const rootURL = new URL('../../', import.meta.url);
const loadedApps = new Map();

// Get a reference to the main content area
const mainContent = document.querySelector('.main-content');

/**
 * Initializes the app loading process.
 * @param {HTMLElement} sidebarEl - The sidebar element to add buttons to.
 * @param {object} dashboardAPI - The API for apps to interact with the core.
 */
export async function initAppLoader(sidebarEl, dashboardAPI) {
    for (const appDir of APP_DIRECTORIES) {
        try {
            const manifest = await fetchManifest(appDir);
            if (manifest) {
                registerApp(manifest, sidebarEl, dashboardAPI);
            }
        } catch (error) {
            console.error(`Failed to load app "${appDir}":`, error);
        }
    }
}

async function fetchManifest(appDir) {
    const manifestURL = new URL(`apps/${appDir}/app.json`, rootURL);
    const response = await fetch(manifestURL);
    if (!response.ok) {
        throw new Error(`Could not fetch manifest for ${appDir} at ${manifestURL}`);
    }
    const manifest = await response.json();
    // Ensure the manifest has an 'id', using the directory name as a fallback.
    manifest.id = manifest.id || appDir;
    return manifest;
}

function registerApp(manifest, sidebarEl, dashboardAPI) {
    const modal = createAppModal(manifest);

    // If the app requests fullscreen, add a special class to its modal.
    if (manifest.displayMode === 'fullscreen') {
        modal.classList.add('modal-overlay--fullscreen');
    }

    document.body.appendChild(modal);

    const button = document.createElement('button');
    button.className = 'sidebar-btn';
    button.title = manifest.name;
    button.innerHTML = manifest.icon;

    // The click handler is now the same simple logic for all apps.
    button.addEventListener('click', () => {
        toggleModal(modal, true);
        loadApp(manifest, modal, dashboardAPI);
    });

    sidebarEl.insertBefore(button, sidebarEl.lastElementChild);
}


function createAppModal(manifest) {
    // This function remains the same.
    const modalOverlay = document.createElement('div');
    modalOverlay.id = `modal-${manifest.id}`;
    modalOverlay.className = 'modal-overlay';
    modalOverlay.innerHTML = `
        <div class="modal-content">
            <button class="modal-close-btn">&times;</button>
            <div class="app-content-container">
                </div>
        </div>
    `;
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay || e.target.classList.contains('modal-close-btn')) {
            toggleModal(modalOverlay, false);
        }
    });
    return modalOverlay;
}

async function loadApp(manifest, modal, dashboardAPI) {
    // This function remains the same.
    if (loadedApps.has(manifest.id)) {
        return;
    }

    const contentContainer = modal.querySelector('.app-content-container');
    try {
        const htmlURL = new URL(`apps/${manifest.id}/${manifest.entrypoints.html}`, rootURL);
        const jsURL = new URL(`apps/${manifest.id}/${manifest.entrypoints.js}`, rootURL);

        const htmlResponse = await fetch(htmlURL);
        if (!htmlResponse.ok) throw new Error('Failed to load HTML.');
        contentContainer.innerHTML = await htmlResponse.text();
        
        const appModule = await import(jsURL);
        
        if (appModule && typeof appModule.init === 'function') {
            appModule.init(dashboardAPI, contentContainer);
        }

        loadedApps.set(manifest.id, true);
    } catch (error) {
        contentContainer.innerHTML = `<p style="color: red;">Error loading app: ${error.message}</p>`;
        console.error(`Error loading app "${manifest.name}":`, error);
    }
}

function toggleModal(modal, show) {
    modal.classList.toggle('visible', show);

    // Also hide/show the main dashboard if the modal is a fullscreen one.
    if (modal.classList.contains('modal-overlay--fullscreen')) {
        mainContent.classList.toggle('main-content-hidden', show);
    }
}