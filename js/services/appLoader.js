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
    // CHANGE HERE: Use a root-relative path for fetching the manifest.
    const response = await fetch(`/apps/${appDir}/app.json`);
    if (!response.ok) {
        throw new Error(`Could not fetch manifest for ${appDir}`);
    }
    const manifest = await response.json();
    // CHANGE HERE: The base path is now root-relative.
    manifest.basePath = `/apps/${appDir}/`;
    return manifest;
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
        // This fetch will now correctly use the root-relative path.
        const htmlResponse = await fetch(manifest.basePath + manifest.entrypoints.html);
        if (!htmlResponse.ok) throw new Error('Failed to load HTML.');
        contentContainer.innerHTML = await htmlResponse.text();
        
        // This dynamic import will now correctly use the root-relative path.
        const jsPath = manifest.basePath + manifest.entrypoints.js;
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

