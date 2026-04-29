const MIN_SPAWN_DELAY_MS = 15000;
const MAX_SPAWN_DELAY_MS = 20000;

const darkOverlay = ensureDarkOverlay();

let spawnTimeoutId = null;
let isConnected = false;
let isOverlayVisible = false;

function ensureDarkOverlay() {
    let overlay = document.getElementById('darkOverlay');

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'darkOverlay';
        document.body.appendChild(overlay);
    }

    return overlay;
}

function getRandomSpawnDelay() {
    return Math.floor(Math.random() * (MAX_SPAWN_DELAY_MS - MIN_SPAWN_DELAY_MS + 1)) + MIN_SPAWN_DELAY_MS;
}

function clearSpawnTimer() {
    if (spawnTimeoutId !== null) {
        clearTimeout(spawnTimeoutId);
        spawnTimeoutId = null;
    }
}

function scheduleNextOverlaySpawn() {
    if (!isConnected) {
        return;
    }

    if (isOverlayVisible) {
        return;
    }

    clearSpawnTimer();

    spawnTimeoutId = setTimeout(() => {
        spawnTimeoutId = null;
        
        if (!isConnected) {
            return;
        }

        if (isOverlayVisible) {
            return;
        }

        showOverlay();
    }, getRandomSpawnDelay());
}

function showOverlay() {
    isOverlayVisible = true;
    darkOverlay.classList.add('visible');
}

function hideOverlay() {
    if (!isOverlayVisible) {
        return;
    }

    isOverlayVisible = false;
    darkOverlay.classList.remove('visible');
    scheduleNextOverlaySpawn();
}

function handleLightChange(event) {
    const lightValue = event.detail?.lightValue;

    if (lightValue === 1) {
        hideOverlay();
    }
}

function handleConnectionChange(event) {
    isConnected = Boolean(event.detail?.isConnected);

    if (!isConnected) {
        clearSpawnTimer();
        isOverlayVisible = false;
        darkOverlay.classList.remove('visible');
        return;
    }

    scheduleNextOverlaySpawn();
}

window.addEventListener('esp32-light-change', handleLightChange);
window.addEventListener('esp32-connection-change', handleConnectionChange);
