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
