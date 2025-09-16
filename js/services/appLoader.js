/**
 * Dynamically discovers and loads apps from the /apps/ directory.
 * It creates sidebar buttons and modals for each detected app.
 */

// In a real backend scenario, this list would be fetched from the server.
const APP_DIRECTORIES = ['focus-fm', 'routine', 'notes', 'todays-focus'];

const loadedApps = new Map();

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
    // This path is relative to index.html and works correctly for fetch.
    const response = await fetch(`apps/${appDir}/app.json`);
    if (!response.ok) {
        throw new Error(`Could not fetch manifest for ${appDir}`);
    }
    // We don't need to store a basePath anymore as we'll construct paths contextually.
    return await response.json();
}

function registerApp(manifest, sidebarEl, dashboardAPI) {
    const modal = createAppModal(manifest);
    document.body.appendChild(modal);

    const button = document.createElement('button');
    button.className = 'sidebar-btn';
    button.title = manifest.name;
    button.innerHTML = manifest.icon;
    button.addEventListener('click', () => {
        toggleModal(modal, true);
        loadApp(manifest, modal, dashboardAPI);
    });

    sidebarEl.insertBefore(button, sidebarEl.lastElementChild);
}

function createAppModal(manifest) {
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
    if (loadedApps.has(manifest.id)) {
        return;
    }

    const contentContainer = modal.querySelector('.app-content-container');
    try {
        // GEÄNDERT: Construct separate paths for fetch and import.

        // Path for fetch(), relative to index.html
        const htmlPath = `apps/${manifest.id}/${manifest.entrypoints.html}`;

        // Path for import(), relative to this file (appLoader.js)
        const jsPath = `../../apps/${manifest.id}/${manifest.entrypoints.js}`;

        const htmlResponse = await fetch(htmlPath);
        if (!htmlResponse.ok) throw new Error('Failed to load HTML.');
        contentContainer.innerHTML = await htmlResponse.text();
        
        const appModule = await import(jsPath);
        
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
}