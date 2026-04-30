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
    const hasEvent = event !== undefined && event !== null;
    const hasDetail = hasEvent && event.detail !== undefined && event.detail !== null;
    const isBoostActive = hasDetail && event.detail.isBoostActive === true;

    if (isBoostActive) {
        activateBoost();
    } else {
        deactivateBoost();
    }
}

function handleBoostChange(event) {
    syncBoost(event);
}

function handleConnectionChange(event) {
    const hasEvent = event !== undefined && event !== null;
    const hasDetail = hasEvent && event.detail !== undefined && event.detail !== null;

    let isConnected;

    if (hasDetail) {
        isConnected = event.detail.isConnected;
    } else {
        isConnected = undefined;
    }
        
    if (!isConnected) {
        deactivateBoost();
    }
}

function initBoost() {
    window.addEventListener('esp32-boost-change', handleBoostChange);
    window.addEventListener('esp32-connection-change', handleConnectionChange);

    deactivateBoost();
}

initBoost();