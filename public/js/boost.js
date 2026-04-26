import { setBoostSpeedMultiplier } from './ui.js';

const BOOST_SPEED_MULTIPLIER = 3.5;

export function activateBoost() {
    setBoostSpeedMultiplier(BOOST_SPEED_MULTIPLIER);
}

export function deactivateBoost() {
    setBoostSpeedMultiplier(1);
}

function syncBoost(event) {
    if (event?.detail?.isBoostActive) {
        activateBoost();
    } else {
        deactivateBoost();
    }
}

window.addEventListener('esp32-boost-change', syncBoost);
window.addEventListener('esp32-connection-change', (event) => {
    if (!event?.detail?.isConnected) {
        deactivateBoost();
    }
});

deactivateBoost();