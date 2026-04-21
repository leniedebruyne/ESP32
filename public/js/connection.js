/*==============================
  App State & BLE Variables
==============================*/

import {
    moveBalloonDown,
    moveBalloonLeft,
    moveBalloonRight,
    moveBalloonUp,
    resetBalloonPosition,
} from './balloon-control.js';

const hasWebBluetooth = "bluetooth" in navigator;
let isConnected = false;
let bluetoothDevice = null;

let characteristicR = null;
let characteristicG = null;
let characteristicB = null;
let characteristicButton = null;
let characteristicBuzzer = null;

export const isEsp32Connected = () => isConnected;

export const getRgbCharacteristics = () => ({
    characteristicR,
    characteristicG,
    characteristicB,
});

export const getBuzzerCharacteristic = () => characteristicBuzzer;

/*==============================
  UUIDs for ESP32 BLE Service
==============================*/

const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const CHARACTERISTIC_R_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const CHARACTERISTIC_G_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
const CHARACTERISTIC_B_UUID = '6e400004-b5a3-f393-e0a9-e50e24dcca9e';
const CHARACTERISTIC_BUTTON_UUID = '6e400006-b5a3-f393-e0a9-e50e24dcca9e';
const CHARACTERISTIC_BUZZER_UUID = '6e400007-b5a3-f393-e0a9-e50e24dcca9e';

/*==============================
  DOM Elements
==============================*/

const $notSupported = document.getElementById("not-supported");
const $supported = document.getElementById("supported");
const $notConnected = document.getElementById("not-connected");
const $connected = document.getElementById("connected");
const $connectButton = document.getElementById("connectButton");
const $disconnectButton = document.getElementById("disconnectButton");
const $deviceName = document.getElementById("deviceName");
const $notifications = document.getElementById("notifications");

/*==============================
  Initialization
==============================*/

const initConnection = () => {
    displaySupportedState();
    if (!hasWebBluetooth) return;

    displayConnectionState();
    $connectButton.addEventListener("click", handleClickConnect);
    $disconnectButton.addEventListener("click", handleClickDisconnect);
};

/*==============================
  Bluetooth Connection
==============================*/

const handleClickConnect = async () => {
    try {
        console.log('Requesting Bluetooth Device...');
        bluetoothDevice = await navigator.bluetooth.requestDevice({
            filters: [{ services: [SERVICE_UUID] }],
        });

        console.log('Connecting to GATT Server...');
        bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);

        const server = await bluetoothDevice.gatt.connect();
        console.log('Getting Service...');
        const service = await server.getPrimaryService(SERVICE_UUID);

        console.log('Getting RGB LED Characteristics...');
        characteristicR = await service.getCharacteristic(CHARACTERISTIC_R_UUID);
        characteristicG = await service.getCharacteristic(CHARACTERISTIC_G_UUID);
        characteristicB = await service.getCharacteristic(CHARACTERISTIC_B_UUID);

        console.log('Getting Button Characteristic...');
        characteristicButton = await service.getCharacteristic(CHARACTERISTIC_BUTTON_UUID);

        try {
            characteristicBuzzer = await service.getCharacteristic(CHARACTERISTIC_BUZZER_UUID);
            console.log('Buzzer characteristic found');
        } catch (error) {
            characteristicBuzzer = null;
            console.warn('Buzzer characteristic not available on device yet.');
        }

        console.log('Starting Notifications...');
        await characteristicButton.startNotifications();
        characteristicButton.addEventListener('characteristicvaluechanged', handleNotificationButton);

        isConnected = true;
        $deviceName.textContent = bluetoothDevice.name || 'Unknown Device';
        $notifications.innerHTML = '<p><em>Waiting for notifications...</em></p>';
        resetBalloonPosition();
        displayConnectionState();
        emitEsp32ConnectionChange();

        console.log('Connected and ready for bidirectional communication!');
    } catch (error) {
        console.error('Connection failed:', error);
        alert('Failed to connect: ' + error.message);
    }
};

const handleClickDisconnect = async () => {
    if (bluetoothDevice && bluetoothDevice.gatt.connected) {

        if (typeof window.turnRgbOff === 'function') {
            window.turnRgbOff();
        }

        await new Promise(resolve => setTimeout(resolve, 100));

        bluetoothDevice.gatt.disconnect();
    }
};

const onDisconnected = () => {
    console.log('Bluetooth Device disconnected');

    if (typeof window.turnRgbOff === 'function') {
        window.turnRgbOff();
    }

    isConnected = false;
    bluetoothDevice = null;
    characteristicR = null;
    characteristicG = null;
    characteristicB = null;
    characteristicButton = null;
    characteristicBuzzer = null;
    resetBalloonPosition();
    displayConnectionState();
    emitEsp32ConnectionChange();
};

const handleNotificationButton = (event) => {
    const value = event.target.value;
    const buttonValue = value.getUint8(0);

    console.log('Button notify received:', buttonValue);

    if (buttonValue === 0) {
        moveBalloonLeft();
    } else if (buttonValue === 1) {
        moveBalloonRight();
    } else if (buttonValue === 3) {
        moveBalloonUp();
    } else if (buttonValue === 4) {
        moveBalloonDown();
    }
};

/*==============================
  UI State Management
==============================*/

const displaySupportedState = () => {
    if (hasWebBluetooth) {
        $notSupported.style.display = "none";
        $supported.style.display = "block";
    } else {
        $notSupported.style.display = "block";
        $supported.style.display = "none";
    }
};

const displayConnectionState = () => {
    if (isConnected) {
        $notConnected.style.display = "none";
        $connected.style.display = "block";
    } else {
        $notConnected.style.display = "block";
        $connected.style.display = "none";
    }
};

// Keep a window alias for compatibility with existing event/UI integrations.
window.isEsp32Connected = isEsp32Connected;

const emitEsp32ConnectionChange = () => {
    window.dispatchEvent(new CustomEvent('esp32-connection-change', {
        detail: { isConnected },
    }));
};

initConnection();