import { onBalloonSizeChange } from './balloon-control.js';
import { setGameSpeedMultiplier } from './ui.js';

const SPEED_BY_SIZE_STATE = {
    0: 1.8, // small balloon: faster ambience
    1: 1.0,  // medium balloon: normal ambience
    2: 0.55,  // large balloon: slower ambience
};

const DEFAULT_SPEED_MULTIPLIER = 1.0;

function getSpeedMultiplierForSize(sizeState) {
    const numericSizeState = Number(sizeState);

    const isValidInteger = Number.isInteger(numericSizeState);
    const sizeExistsInMap = Object.hasOwn(SPEED_BY_SIZE_STATE, numericSizeState);
    
    if (isValidInteger && sizeExistsInMap) {
        return SPEED_BY_SIZE_STATE[numericSizeState];
    }

    return DEFAULT_SPEED_MULTIPLIER;
}

function initBalloonSpeedSync() {
    onBalloonSizeChange((sizeState) => {
        setGameSpeedMultiplier(getSpeedMultiplierForSize(sizeState));
    });
}

initBalloonSpeedSync();
