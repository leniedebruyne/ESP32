/*==============================
  Balloon Control
==============================*/

const $balloonImg = document.querySelector('img[alt="Balloon Control"]');
const $balloonContainer = $balloonImg?.parentElement;

let balloonPositionX = 0;
let balloonPositionY = 0;
let balloonTiltDegrees = 0;
let balloonSizeState = 1;
const balloonSizeListeners = new Set();
const BALLOON_MOVE_STEP = 10;
const BALLOON_MAX_TILT_DEGREES = 10;

// object to track the size states
const BALLOON_SIZE_MAP = {
    0: 'balloon-size-small',
    1: 'balloon-size-medium',
    2: 'balloon-size-large',
};

// movement

export const moveBalloonLeft = () => {
    balloonPositionX -= BALLOON_MOVE_STEP;
    updateBalloonPosition();
};

export const moveBalloonRight = () => {
    balloonPositionX += BALLOON_MOVE_STEP;
    updateBalloonPosition();
};

export const moveBalloonUp = () => {
    balloonPositionY -= BALLOON_MOVE_STEP;
    updateBalloonPosition();
};

export const moveBalloonDown = () => {
    balloonPositionY += BALLOON_MOVE_STEP;
    updateBalloonPosition();
};

export const setBalloonTilt = (direction) => {
    if (direction === 'left') {
        balloonTiltDegrees = -BALLOON_MAX_TILT_DEGREES;
    } else if (direction === 'right') {
        balloonTiltDegrees = BALLOON_MAX_TILT_DEGREES;
    } else {
        balloonTiltDegrees = 0;
    }

    updateBalloonPosition();
};

export const resetBalloonPosition = () => {
    balloonPositionX = 0;
    balloonPositionY = 0;
    balloonTiltDegrees = 0;
    updateBalloonPosition();
};


// balloon size
export const setBalloonSize = (sizeState) => {
    if (!$balloonImg) return;

    const nextSizeState = Number(sizeState);

    if (!Number.isInteger(nextSizeState)) return;
    if (!(nextSizeState in BALLOON_SIZE_MAP)) return;

    balloonSizeState = nextSizeState;

    const classNames = Object.values(BALLOON_SIZE_MAP);

    classNames.forEach((className) => {
        $balloonImg.classList.remove(className);
    });

    const newClass = BALLOON_SIZE_MAP[balloonSizeState];
    $balloonImg.classList.add(newClass);

    updateBalloonPosition();
    notifyBalloonSizeChange();
};

export const onBalloonSizeChange = (listener) => {
    if (typeof listener !== 'function') {
        return () => { };
    }

    balloonSizeListeners.add(listener);

    // meteen initial value pushen
    listener(balloonSizeState);

    // unsubscribe function
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

    $balloonContainer.style.transform = `translate3d(${balloonPositionX}px, ${balloonPositionY}px, 0) rotate(${balloonTiltDegrees}deg)`;
};

const notifyBalloonSizeChange = () => {
    balloonSizeListeners.forEach((listener) => {
        listener(balloonSizeState);
    });
};



function initballoon() {
    resetBalloonPosition();
    setBalloonSize(balloonSizeState);
}


initballoon();