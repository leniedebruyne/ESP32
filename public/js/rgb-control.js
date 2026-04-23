/*==============================
  RGB LED Control
==============================*/

import { getRgbCharacteristics, isEsp32Connected } from './connection.js';

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

// Initializes RGB control listeners and connection sync behavior.
const initRgbControl = () => {
    window.addEventListener('esp32-connection-change', (event) => {
        if (event?.detail?.isConnected) {
            sendRgbIfConnected(255, 0, 0);
        }
    });

    window.addEventListener('esp32-rgb-off-request', () => {
        turnRgbOff();
    });
};

initRgbControl();