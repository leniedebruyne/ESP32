import { setBoostSpeedMultiplier, setBoostTimerMultiplier } from './ui.js';

const BOOST_SPEED_MULTIPLIER = 3.5;

export function activateBoost() {
    setBoostSpeedMultiplier(BOOST_SPEED_MULTIPLIER);
    setBoostTimerMultiplier(BOOST_SPEED_MULTIPLIER);
}

export function deactivateBoost() {
    setBoostSpeedMultiplier(1);
    setBoostTimerMultiplier(1);
}

function syncBoost(event) {
    if (event?.detail?.isBoostActive) {
        activateBoost();
    } else {
        deactivateBoost();
    }
}

function handleBoostChange(event) {
    syncBoost(event);
}

function handleConnectionChange(event) {
    const isConnected = event?.detail?.isConnected;

    if (!isConnected) {
        deactivateBoost();
    }
}

window.addEventListener('esp32-boost-change', handleBoostChange);
window.addEventListener('esp32-connection-change', handleConnectionChange);

deactivateBoost();