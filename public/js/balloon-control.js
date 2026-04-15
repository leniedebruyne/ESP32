/*==============================
  Balloon Control
==============================*/

const $balloonImg = document.querySelector('img[alt="Balloon Control"]');
const $balloonContainer = $balloonImg?.parentElement;

let balloonPosition = 0;

export const moveBalloonLeft = () => {
    balloonPosition -= 5;
    updateBalloonPosition();
};

export const moveBalloonRight = () => {
    balloonPosition += 5;
    updateBalloonPosition();
};

export const resetBalloonPosition = () => {
    balloonPosition = 0;
    updateBalloonPosition();
};

const updateBalloonPosition = () => {
    if (!$balloonContainer) return;

    const min = -150;
    const max = 150;

    balloonPosition = Math.max(min, Math.min(max, balloonPosition));
    $balloonContainer.style.transform = `translateX(${balloonPosition}px)`;
};

resetBalloonPosition();