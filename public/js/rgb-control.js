/*==============================
  RGB LED Control
==============================*/

import { getRgbCharacteristics, isEsp32Connected } from './connection.js';

const $r = document.getElementById("r");
const $g = document.getElementById("g");
const $b = document.getElementById("b");
const $rValue = document.getElementById("rValue");
const $gValue = document.getElementById("gValue");
const $bValue = document.getElementById("bValue");
const $colorPreview = document.getElementById("colorPreview");

let writeQueue = Promise.resolve();

// Queues BLE writes so RGB updates are sent in order.
const queueWrite = (characteristic, value) => {
    writeQueue = writeQueue.then(() =>
        characteristic
            .writeValueWithoutResponse(new Uint8Array([value]))
            .catch(error => {
                console.error('Write failed:', error);
            })
    );
};


// Updates the preview swatch to match the current slider values.
const updateColorPreview = () => {
    const r = parseInt($r.value);
    const g = parseInt($g.value);
    const b = parseInt($b.value);
    $colorPreview.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
};


// Sets RGB slider/value labels in the UI and refreshes the preview.
const setRgbValues = (r, g, b) => {
    if (!$r || !$g || !$b) return;

    $r.value = String(r);
    $g.value = String(g);
    $b.value = String(b);

    if ($rValue) $rValue.textContent = String(r);
    if ($gValue) $gValue.textContent = String(g);
    if ($bValue) $bValue.textContent = String(b);

    updateColorPreview();
};


// Sends RGB values to the device when a BLE connection is active.
export const sendRgbIfConnected = (r, g, b) => {
    if (!isEsp32Connected()) return;

    const { characteristicR, characteristicG, characteristicB } = getRgbCharacteristics();

    if (characteristicR) queueWrite(characteristicR, r);
    if (characteristicG) queueWrite(characteristicG, g);
    if (characteristicB) queueWrite(characteristicB, b);
};


// Turns the RGB LED off by writing zero to all channels.
export const turnRgbOff = () => {
    const { characteristicR, characteristicG, characteristicB } = getRgbCharacteristics();

    if (characteristicR) queueWrite(characteristicR, 0);
    if (characteristicG) queueWrite(characteristicG, 0);
    if (characteristicB) queueWrite(characteristicB, 0);
};


// Sets the default LED color to red after connecting.
const setLedRed = () => {
    setRgbValues(255, 0, 0);
    sendRgbIfConnected(255, 0, 0);
};


// Handles red slider input and writes the new red value.
const handleInputR = async () => {
    const value = parseInt($r.value);
    $rValue.textContent = value;
    updateColorPreview();

    const { characteristicR } = getRgbCharacteristics();

    if (!isEsp32Connected()) return;
    if (!characteristicR) return;

    queueWrite(characteristicR, value);
};

// Handles green slider input and writes the new green value.
const handleInputG = async () => {
    const value = parseInt($g.value);
    $gValue.textContent = value;
    updateColorPreview();

    const { characteristicG } = getRgbCharacteristics();

    if (!isEsp32Connected()) return;
    if (!characteristicG) return;

    queueWrite(characteristicG, value);
};

// Handles blue slider input and writes the new blue value.
const handleInputB = async () => {
    const value = parseInt($b.value);
    $bValue.textContent = value;
    updateColorPreview();

    const { characteristicB } = getRgbCharacteristics();

    if (!isEsp32Connected()) return;
    if (!characteristicB) return;

    queueWrite(characteristicB, value);
};

// Initializes RGB control listeners and connection sync behavior.
const initRgbControl = () => {
    if (!$r) return;
    if (!$g) return;
    if (!$b) return;
    if (!$colorPreview) return;

    setLedRed();
    $r.addEventListener("input", handleInputR);
    $g.addEventListener("input", handleInputG);
    $b.addEventListener("input", handleInputB);

    window.addEventListener('esp32-connection-change', (event) => {
        if (event?.detail?.isConnected) {
            setLedRed();
        }
    });

    window.addEventListener('esp32-rgb-off-request', () => {
        turnRgbOff();
    });
};

initRgbControl();