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
let steadyRgb = { r: 255, g: 0, b: 0 };

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getCurrentRgb = () => ({ ...steadyRgb });

const setCurrentRgb = (r, g, b) => {
    steadyRgb = { r, g, b };
};

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

const writeRgbChannels = async (r, g, b) => {
    const { characteristicR, characteristicG, characteristicB } = getRgbCharacteristics();

    if (characteristicR) {
        await characteristicR.writeValueWithoutResponse(new Uint8Array([r]));
    }

    if (characteristicG) {
        await characteristicG.writeValueWithoutResponse(new Uint8Array([g]));
    }

    if (characteristicB) {
        await characteristicB.writeValueWithoutResponse(new Uint8Array([b]));
    }
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

const getSliderRgb = () => ({
    r: parseInt($r.value),
    g: parseInt($g.value),
    b: parseInt($b.value),
});


// Sends RGB values to the device when a BLE connection is active.
export const sendRgbIfConnected = (r, g, b) => {
    if (!isEsp32Connected()) return;

    setCurrentRgb(r, g, b);

    const { characteristicR, characteristicG, characteristicB } = getRgbCharacteristics();

    if (characteristicR) queueWrite(characteristicR, r);
    if (characteristicG) queueWrite(characteristicG, g);
    if (characteristicB) queueWrite(characteristicB, b);
};


// Turns the RGB LED off by writing zero to all channels.
export const turnRgbOff = () => {
    setCurrentRgb(0, 0, 0);

    const { characteristicR, characteristicG, characteristicB } = getRgbCharacteristics();

    if (characteristicR) queueWrite(characteristicR, 0);
    if (characteristicG) queueWrite(characteristicG, 0);
    if (characteristicB) queueWrite(characteristicB, 0);
};

export const blinkRgb = (r, g, b, flashes = 2) => {
    if (!isEsp32Connected()) return;

    const restoreRgb = getCurrentRgb();

    writeQueue = writeQueue.then(async () => {
        try {
            for (let index = 0; index < flashes; index += 1) {
                await writeRgbChannels(r, g, b);
                await wait(140);
                await writeRgbChannels(0, 0, 0);
                if (index < flashes - 1) {
                    await wait(120);
                }
            }

            await writeRgbChannels(restoreRgb.r, restoreRgb.g, restoreRgb.b);
        } catch (error) {
            console.error('Blink failed:', error);
        }
    });
};


// Sets the default LED color to red after connecting.
const setLedRed = () => {
    setRgbValues(255, 0, 0);
    sendRgbIfConnected(255, 0, 0);
};


// Handles red slider input and writes the new red value.
const handleInputR = async () => {
    const value = parseInt($r.value);
    const { g, b } = getSliderRgb();
    setCurrentRgb(value, g, b);
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
    const { r, b } = getSliderRgb();
    setCurrentRgb(r, value, b);
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
    const { r, g } = getSliderRgb();
    setCurrentRgb(r, g, value);
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