/*==============================
  Buzzer Logic
==============================*/

import { getBuzzerCharacteristic, isEsp32Connected } from './connection.js';

const COLLISION_BUZZER_VALUE = 1;
const COLLISION_COOLDOWN_MS = 350;

let lastCollisionBuzzAt = 0;
let writeQueue = Promise.resolve();


// Helper function to queue writes to the buzzer characteristic
const queueWrite = (characteristic, value) => {
    writeQueue = writeQueue.then(() =>
        characteristic
            .writeValueWithoutResponse(new Uint8Array([value]))
            .catch(error => {
                console.error('Buzzer write failed:', error);
            })
    );
};


// Function to trigger the buzzer for a collision event
export const triggerCollisionBuzzer = () => {
    if (!isEsp32Connected()) {
        return;
    }

    const now = Date.now();
    if (now - lastCollisionBuzzAt < COLLISION_COOLDOWN_MS) {
        return;
    }

    const characteristicBuzzer = getBuzzerCharacteristic();
    if (!characteristicBuzzer) {
        return;
    }

    lastCollisionBuzzAt = now;
    queueWrite(characteristicBuzzer, COLLISION_BUZZER_VALUE);
};

// Function to trigger a game over melody
export const triggerGameOverMelody = async () => {
    if (!isEsp32Connected()) return;

    const characteristicBuzzer = getBuzzerCharacteristic();
    if (!characteristicBuzzer) return;

    const sleep = (ms) => new Promise(res => setTimeout(res, ms));

    const beeps = [
        { value: 2, duration: 150, pause: 250 },
        { value: 1, duration: 250, pause: 350 },
        { value: 1, duration: 400, pause: 500 },
        { value: 1, duration: 800, pause: 1200 } 
    ];

    for (const beep of beeps) {
        queueWrite(characteristicBuzzer, beep.value);
        await sleep(beep.duration);

        queueWrite(characteristicBuzzer, 0);
        await sleep(beep.pause);
    }
};

