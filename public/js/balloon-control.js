/*==============================
  Balloon Control
==============================*/

const $balloonImg = document.querySelector('img[alt="Balloon Control"]');
const $balloonContainer = $balloonImg?.parentElement;

let balloonPositionX = 0;
let balloonPositionY = 0;

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

resetBalloonPosition();