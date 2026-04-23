/*==============================
  Balloon Control
==============================*/

const $balloonImg = document.querySelector('img[alt="Balloon Control"]');
const $balloonContainer = $balloonImg?.parentElement;

let balloonPositionX = 0;
let balloonPositionY = 0;
let balloonSizeState = 1;
const balloonSizeListeners = new Set();

// object to track the size states
const BALLOON_SIZE_MAP = {
    0: 'balloon-size-small',
    1: 'balloon-size-medium',
    2: 'balloon-size-large',
};

// movement

export const moveBalloonLeft = () => {
    balloonPositionX -= 5;
    updateBalloonPosition();
};

export const moveBalloonRight = () => {
    balloonPositionX += 5;
    updateBalloonPosition();
};

export const moveBalloonUp = () => {
    balloonPositionY -= 5;
    updateBalloonPosition();
};

export const moveBalloonDown = () => {
    balloonPositionY += 5;
    updateBalloonPosition();
};

export const resetBalloonPosition = () => {
    balloonPositionX = 0;
    balloonPositionY = 0;
    updateBalloonPosition();
};


// balloon size
export const setBalloonSize = (sizeState) => {
    if (!$balloonImg) return;

    const nextSizeState = Number(sizeState);
    if (!Number.isInteger(nextSizeState) || !(nextSizeState in BALLOON_SIZE_MAP)) {
        return;
    }

    balloonSizeState = nextSizeState;

    Object.values(BALLOON_SIZE_MAP).forEach((className) => {
        $balloonImg.classList.remove(className);
    });

    $balloonImg.classList.add(BALLOON_SIZE_MAP[balloonSizeState]);
    updateBalloonPosition();
    notifyBalloonSizeChange();
};

export const onBalloonSizeChange = (listener) => {
    if (typeof listener !== 'function') {
        return () => { };
    }

    balloonSizeListeners.add(listener);
    listener(balloonSizeState);

    return () => {
        balloonSizeListeners.delete(listener);
    };
};


// balloon position
const updateBalloonPosition = () => {
    if (!$balloonContainer) return;

    // Get the game stage container dimensions
    const gameStage = $balloonContainer.parentElement;
    if (!gameStage) return;

    const stageRect = gameStage.getBoundingClientRect();
    const balloonRect = $balloonImg.getBoundingClientRect();

    // Calculate boundaries to allow balloon to touch screen edges
    const balloonWidth = balloonRect.width;
    const balloonHeight = balloonRect.height;
    const stageWidth = stageRect.width;
    const stageHeight = stageRect.height;

    // Calculate max displacement from center
    const maxX = (stageWidth / 2) - (balloonWidth / 2);
    const maxY = (stageHeight / 2) - (balloonHeight / 2);
    const minX = -maxX;
    const minY = -maxY;

    balloonPositionX = Math.max(minX, Math.min(maxX, balloonPositionX));
    balloonPositionY = Math.max(minY, Math.min(maxY, balloonPositionY));
    $balloonContainer.style.transform = `translate(${balloonPositionX}px, ${balloonPositionY}px)`;
};

const notifyBalloonSizeChange = () => {
    balloonSizeListeners.forEach((listener) => {
        try {
            listener(balloonSizeState);
        } catch (error) {
            console.error('Balloon size listener failed:', error);
        }
    });
};



function initballoon() {
    resetBalloonPosition();
    setBalloonSize(balloonSizeState);
}


initballoon();