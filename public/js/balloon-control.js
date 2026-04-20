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

    const minX = -150;
    const maxX = 150;
    const minY = -220;
    const maxY = 220;

    balloonPositionX = Math.max(minX, Math.min(maxX, balloonPositionX));
    balloonPositionY = Math.max(minY, Math.min(maxY, balloonPositionY));
    $balloonContainer.style.transform = `translate(${balloonPositionX}px, ${balloonPositionY}px)`;
};

resetBalloonPosition();