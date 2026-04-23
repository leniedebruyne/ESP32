import { isEsp32Connected } from './connection.js';
import { onBalloonSizeChange } from './balloon-control.js';
import { gainLife } from './ui.js';

// ==== SHIELD SETTINGS =====
const SHIELD_DELAY_MIN = 8000;
const SHIELD_DELAY_MAX = 10000;
const SHIELD_SIZE = 50;

// ===== HEART SETTINGS =====
const HEART_DELAY_MIN = 11000;
const HEART_DELAY_MAX = 17000;
const HEART_SIZE = 40;

// ===== STATE =====
let shieldTimeoutId = null;
let heartTimeoutId = null;

let isShieldActive = false;
let isHeartActive = false;
let currentBalloonSizeState = 1;

const BALLOON_SIZE_FOR_ITEM = {
    heart: 0,
    shield: 2,
};

onBalloonSizeChange((sizeState) => {
    currentBalloonSizeState = Number(sizeState);
});

// ===== HELPERS =====
function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}

function getBalloonElement() {
    return document.querySelector('img[alt="Balloon Control"]');
}

function isRectOverlapping(firstRect, secondRect) {
    return firstRect.left < secondRect.right
        && firstRect.right > secondRect.left
        && firstRect.top < secondRect.bottom
        && firstRect.bottom > secondRect.top;
}

function canCollectItem(itemType) {
    return currentBalloonSizeState === BALLOON_SIZE_FOR_ITEM[itemType];
}

function trackCollectible(el, itemType) {
    const animate = () => {
        if (!el.isConnected) {
            return;
        }

        const balloon = getBalloonElement();

        if (balloon) {
            const itemRect = el.getBoundingClientRect();
            const balloonRect = balloon.getBoundingClientRect();

            if (isRectOverlapping(itemRect, balloonRect) && canCollectItem(itemType)) {
                if (itemType === 'heart') {
                    gainLife();
                }

                el.remove();
                return;
            }
        }

        window.requestAnimationFrame(animate);
    };

    window.requestAnimationFrame(animate);
}

// ===== SPAWN SHIELD =====
function spawnShield() {
    if (!isEsp32Connected()) return;

    const el = document.createElement('img');
    el.src = '/assets/shield.png';
    el.className = 'falling-shield';

    const left = getRandom(0, window.innerWidth - SHIELD_SIZE);

    el.style.width = `${SHIELD_SIZE}px`;
    el.style.left = `${left}px`;

    document.body.appendChild(el);
    trackCollectible(el, 'shield');

    el.addEventListener('animationend', () => el.remove(), { once: true });
}

// ===== SPAWN HEART =====
function spawnHeart() {
    if (!isEsp32Connected()) return;

    const el = document.createElement('img');
    el.src = '/assets/heart.png';
    el.className = 'falling-heart';

    const left = getRandom(0, window.innerWidth - HEART_SIZE);

    el.style.width = `${HEART_SIZE}px`;
    el.style.left = `${left}px`;

    document.body.appendChild(el);
    trackCollectible(el, 'heart');

    el.addEventListener('animationend', () => el.remove(), { once: true });
}

// ===== LOOPS =====
function shieldLoop() {
    if (!isShieldActive) return;

    const delay = getRandom(SHIELD_DELAY_MIN, SHIELD_DELAY_MAX);

    shieldTimeoutId = setTimeout(() => {
        spawnShield();
        shieldLoop();
    }, delay);
}

function heartLoop() {
    if (!isHeartActive) return;

    const delay = getRandom(HEART_DELAY_MIN, HEART_DELAY_MAX);

    heartTimeoutId = setTimeout(() => {
        spawnHeart();
        heartLoop();
    }, delay);
}

// ===== START / STOP =====
export function startShieldDrops() {
    if (isShieldActive) return;
    isShieldActive = true;
    shieldLoop();
}

export function stopShieldDrops() {
    isShieldActive = false;
    clearTimeout(shieldTimeoutId);
    document.querySelectorAll('.falling-shield').forEach(el => el.remove());
}

export function startHeartDrops() {
    if (isHeartActive) return;
    isHeartActive = true;
    heartLoop();
}

export function stopHeartDrops() {
    isHeartActive = false;
    clearTimeout(heartTimeoutId);
    document.querySelectorAll('.falling-heart').forEach(el => el.remove());
}

// ===== SYNC MET ESP =====
function sync() {
    if (isEsp32Connected()) {
        startShieldDrops();
        startHeartDrops();
    } else {
        stopShieldDrops();
        stopHeartDrops();
    }
}

window.addEventListener('esp32-connection-change', sync);
sync(); 
