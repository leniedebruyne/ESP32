/*==============================
  Ambient UI: Clouds + Birds
==============================*/

const cloudContainer = ensureCloudContainer();
const maxClouds = 4;

const gameArea = document.body;
const balloon = document.querySelector('img[alt="Balloon Control"]');

const timeLabel = document.querySelector('.hud .time');
const bestLabel = document.querySelector('.hud .best');
const livesLabel = document.querySelector('.hud .lives');

let speedMultiplier = 1;
let birdExists = false;
let cloudIntervalId = null;
let birdIntervalId = null;
let activeBird = null;

const MAX_LIVES = 3;
const BEST_TIME_STORAGE_KEY = 'balloon-best-time-seconds';

let lives = MAX_LIVES;
let gameStartTimestamp = null;
let timerIntervalId = null;
let bestTimeSeconds = loadBestTime();

const BIRD_OFFSCREEN_PADDING = 100;

function ensureCloudContainer() {
    let container = document.querySelector('.clouds');

    if (!container) {
        container = document.createElement('div');
        container.className = 'clouds';
        document.body.prepend(container);
    }

    return container;
}

function isEsp32ConnectionActive() {
    if (typeof window.isEsp32Connected === 'function') {
        return window.isEsp32Connected();
    }

    return false;
}

function loadBestTime() {
    const stored = Number(localStorage.getItem(BEST_TIME_STORAGE_KEY));
    if (Number.isFinite(stored) && stored >= 0) {
        return stored;
    }

    return 0;
}

function formatTime(totalSeconds) {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateHudTime(seconds) {
    if (timeLabel) {
        timeLabel.textContent = `Time: ${formatTime(seconds)}`;
    }
}

function updateHudBest() {
    if (bestLabel) {
        bestLabel.textContent = `Best time: ${formatTime(bestTimeSeconds)}`;
    }
}

function updateHudLives() {
    if (!livesLabel) {
        return;
    }

    const full = '❤️ '.repeat(lives).trim();
    const empty = '🤍 '.repeat(Math.max(0, MAX_LIVES - lives)).trim();
    livesLabel.textContent = [full, empty].filter(Boolean).join(' ').trim();
}

function getElapsedSeconds() {
    if (!gameStartTimestamp) {
        return 0;
    }

    return (Date.now() - gameStartTimestamp) / 1000;
}

function startHudTimer() {
    stopHudTimer();
    gameStartTimestamp = Date.now();
    updateHudTime(0);

    timerIntervalId = setInterval(() => {
        updateHudTime(getElapsedSeconds());
    }, 250);
}

function stopHudTimer() {
    if (timerIntervalId !== null) {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
    }
}

function updateBestTimeIfNeeded(finalSeconds) {
    if (finalSeconds > bestTimeSeconds) {
        bestTimeSeconds = finalSeconds;
        localStorage.setItem(BEST_TIME_STORAGE_KEY, String(bestTimeSeconds));
        updateHudBest();
    }
}

function beginRound() {
    lives = MAX_LIVES;
    updateHudLives();
    updateLedByLives();
    startHudTimer();
}

function endRound() {
    const finalSeconds = getElapsedSeconds();
    stopHudTimer();
    updateHudTime(finalSeconds);
    updateBestTimeIfNeeded(finalSeconds);
}

function loseLife() {
    lives = Math.max(0, lives - 1);
    updateHudLives();
    updateLedByLives();

    if (lives === 0) {
        endRound();
        stopAmbientSpawns();

        setTimeout(() => {
            if (!isEsp32ConnectionActive()) {
                return;
            }

            beginRound();
            startAmbientSpawns();
        }, 1200);
    }
}

function spawnCloud() {
    if (!isEsp32ConnectionActive()) {
        return;
    }

    if (!cloudContainer) {
        return;
    }

    if (cloudContainer.children.length >= maxClouds) {
        return;
    }

    const cloud = document.createElement('div');
    cloud.classList.add('cloud');

    cloud.style.backgroundImage = "url('/assets/Cloud.png')";
    cloud.style.left = Math.random() * 80 + 10 + 'vw';

    const scale = Math.random() * 0.6 + 0.7;
    cloud.style.setProperty('--scale', scale);

    const duration = (Math.random() * 10 + 8) / Math.max(speedMultiplier, 0.1);
    cloud.style.animation = `rise ${duration}s linear forwards`;

    cloudContainer.appendChild(cloud);

    cloud.addEventListener('animationend', () => {
        cloud.remove();
    });
}

function spawnBird() {
    if (!isEsp32ConnectionActive() || birdExists || !gameArea) {
        return;
    }

    birdExists = true;

    const bird = document.createElement('div');
    bird.classList.add('bird');
    bird.innerHTML = '<img src="/assets/Bird.png" alt="bird">';
    activeBird = bird;

    const topPos = Math.random() * (window.innerHeight * 0.45) + window.innerHeight * 0.12;
    bird.style.top = `${topPos}px`;

    const fromLeft = Math.random() < 0.5;
    let pos = fromLeft ? -BIRD_OFFSCREEN_PADDING : window.innerWidth + BIRD_OFFSCREEN_PADDING;
    const direction = fromLeft ? 1 : -1;

    bird.style.left = pos + 'px';
    bird.style.transform = `scaleX(${fromLeft ? 1 : -1})`;

    const baseSpeed = Math.random() * 1.8 + 0.8;

    gameArea.appendChild(bird);

    const cleanupBird = () => {
        if (activeBird === bird) {
            activeBird = null;
        }
        bird.remove();
        birdExists = false;
    };

    function animate() {
        if (!isEsp32ConnectionActive()) {
            cleanupBird();
            return;
        }

        const step = baseSpeed * speedMultiplier * direction;
        const steps = Math.max(1, Math.ceil(Math.abs(step)));

        try {
            for (let i = 0; i < steps; i++) {
                pos += direction;
                bird.style.left = pos + 'px';

                if (balloon) {
                    const birdRect = bird.getBoundingClientRect();
                    const balloonRect = balloon.getBoundingClientRect();

                    if (
                        birdRect.left < balloonRect.right &&
                        birdRect.right > balloonRect.left &&
                        birdRect.top < balloonRect.bottom &&
                        birdRect.bottom > balloonRect.top
                    ) {
                        loseLife();
                        cleanupBird();
                        return;
                    }
                }
            }
        } catch (error) {
            console.error('Bird animation failed:', error);
            cleanupBird();
            return;
        }

        if ((direction === 1 && pos > window.innerWidth + BIRD_OFFSCREEN_PADDING) ||
            (direction === -1 && pos < -BIRD_OFFSCREEN_PADDING)) {
            cleanupBird();
            return;
        }

        requestAnimationFrame(animate);
    }

    animate();
}

function startAmbientSpawns() {
    spawnCloud();
    spawnBird();

    if (cloudIntervalId === null) {
        cloudIntervalId = setInterval(spawnCloud, 2200);
    }

    if (birdIntervalId === null) {
        birdIntervalId = setInterval(spawnBird, 1000);
    }
}

function stopAmbientSpawns() {
    if (cloudIntervalId !== null) {
        clearInterval(cloudIntervalId);
        cloudIntervalId = null;
    }

    if (birdIntervalId !== null) {
        clearInterval(birdIntervalId);
        birdIntervalId = null;
    }

    if (activeBird) {
        activeBird.remove();
        activeBird = null;
    }

    birdExists = false;
}

function syncAmbientSpawns() {
    if (isEsp32ConnectionActive()) {
        beginRound();
        startAmbientSpawns();
    } else {
        endRound();
        stopAmbientSpawns();
        lives = MAX_LIVES;
        updateHudLives();
    }
}

function updateLedByLives() {
    if (!isEsp32ConnectionActive()) return;

    if (lives === 3) {
        sendRgbIfConnected(0, 40, 0); // groen
    }
    else if (lives === 2) {
        sendRgbIfConnected(60, 20, 0); // oranje
    }
    else if (lives === 1) {
        sendRgbIfConnected(80, 0, 0); // rood
    }
    else if (lives === 0) {
        sendRgbIfConnected(0, 0, 0); // uit
    }
}

updateHudBest();
updateHudLives();
updateHudTime(0);

window.addEventListener('esp32-connection-change', syncAmbientSpawns);
syncAmbientSpawns();

window.setGameSpeedMultiplier = (value) => {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
        speedMultiplier = parsed;
    }
};
