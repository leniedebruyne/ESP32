/*==============================
  App State & BLE Variables
==============================*/

// app state
const hasWebBluetooth = "bluetooth" in navigator;
let isConnected = false;
let bluetoothDevice = null;


// RGB LED characteristics (WRITE)
let characteristicR = null;
let characteristicG = null;
let characteristicB = null;

// Button characteristic (NOTIFY)
let characteristicButton = null;


// balloon position state
let balloonPosition = 0; // -1 = left, 0 = center, 1 = right

/*==============================
  UUIDs for ESP32 BLE Service
==============================*/

// UUIDs - these should match your ESP32 BLE service
const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';

// RGB LED (WRITE)
const CHARACTERISTIC_R_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const CHARACTERISTIC_G_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
const CHARACTERISTIC_B_UUID = '6e400004-b5a3-f393-e0a9-e50e24dcca9e';
// Buttons (NOTIFY)
const CHARACTERISTIC_BUTTON_UUID = '6e400006-b5a3-f393-e0a9-e50e24dcca9e';

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

const $r = document.getElementById("r");
const $g = document.getElementById("g");
const $b = document.getElementById("b");
const $rValue = document.getElementById("rValue");
const $gValue = document.getElementById("gValue");
const $bValue = document.getElementById("bValue");
const $colorPreview = document.getElementById("colorPreview");
const $balloonImg = document.querySelector('img[alt="Balloon Control"]');
const $balloonContainer = $balloonImg?.parentElement;

/*==============================
  Initialization
==============================*/

const init = async () => {
    displaySupportedState();
    if (!hasWebBluetooth) return;
    displayConnectionState();

    $connectButton.addEventListener("click", handleClickConnect);
    $disconnectButton.addEventListener("click", handleClickDisconnect);

    $r.addEventListener("input", handleInputR);
    $g.addEventListener("input", handleInputG);
    $b.addEventListener("input", handleInputB);
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

        /*==============================
            Getting Characteristics
        ==============================*/

        // Get RGB LED characteristics (WRITE)
        console.log('Getting RGB LED Characteristics...');
        characteristicR = await service.getCharacteristic(CHARACTERISTIC_R_UUID);
        characteristicG = await service.getCharacteristic(CHARACTERISTIC_G_UUID);
        characteristicB = await service.getCharacteristic(CHARACTERISTIC_B_UUID);

        // Get Button characteristic (NOTIFY)
        console.log('Getting Button Characteristic...');
        characteristicButton = await service.getCharacteristic(CHARACTERISTIC_BUTTON_UUID);

        /*==============================
            Start Notifications
        ==============================*/

        // Start notifications for potmeter and buttons
        console.log('Starting Notifications...');
        await characteristicButton.startNotifications();

        characteristicButton.addEventListener('characteristicvaluechanged', handleNotificationButton);

        isConnected = true;
        $deviceName.textContent = bluetoothDevice.name || 'Unknown Device';
        $notifications.innerHTML = '<p><em>Waiting for notifications...</em></p>';
        balloonPosition = 0; // Reset balloon position
        resetBalloonPosition();
        displayConnectionState();

        console.log('Connected and ready for bidirectional communication!');
    } catch (error) {
        console.error('Connection failed:', error);
        alert('Failed to connect: ' + error.message);
    }
};

const handleClickDisconnect = async () => {
    if (bluetoothDevice && bluetoothDevice.gatt.connected) {
        bluetoothDevice.gatt.disconnect();
    }
};

const onDisconnected = () => {
    console.log('Bluetooth Device disconnected');
    isConnected = false;
    bluetoothDevice = null;
    characteristicR = null;
    characteristicG = null;
    characteristicB = null;
    characteristicButton = null;
    balloonPosition = 0;
    resetBalloonPosition();
    displayConnectionState();
};


const handleNotificationButton = (event) => {
    const value = event.target.value;
    const buttonValue = value.getUint8(0); 

    console.log('Button notify received:', buttonValue); // <<< debug hier


    if (buttonValue === 0) {
        moveBalloonLeft();
    } else if (buttonValue === 1) {
        moveBalloonRight();
    }
};



/*==============================
  RGB LED Control
==============================*/
const updateColorPreview = () => {
    const r = parseInt($r.value);
    const g = parseInt($g.value);
    const b = parseInt($b.value);
    $colorPreview.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
};

/*==============================
  Balloon Control
==============================*/
const moveBalloonLeft = () => {
    balloonPosition = -1;
    updateBalloonPosition();
};

const moveBalloonRight = () => {
    balloonPosition = 1;
    updateBalloonPosition();
};

const resetBalloonPosition = () => {
    balloonPosition = 0;
    updateBalloonPosition();
};

const updateBalloonPosition = () => {
    if (!$balloonContainer) return;

    let transform = 'translateX(0)';
    if (balloonPosition === -1) {
        transform = 'translateX(-60px)';
    } else if (balloonPosition === 1) {
        transform = 'translateX(60px)';
    }

    $balloonContainer.style.transform = transform;
};

// Queue to serialize BLE write operations
let writeQueue = Promise.resolve();

const queueWrite = (characteristic, value) => {
    writeQueue = writeQueue.then(async () => {
        try {
            await characteristic.writeValueWithoutResponse(new Uint8Array([value]));
        } catch (error) {
            console.error('Write failed:', error);
        }
    });
};

const handleInputR = async () => {
    const value = parseInt($r.value);
    $rValue.textContent = value;
    updateColorPreview();

    if (!isConnected || !characteristicR) return;
    queueWrite(characteristicR, value);
};

const handleInputG = async () => {
    const value = parseInt($g.value);
    $gValue.textContent = value;
    updateColorPreview();

    if (!isConnected || !characteristicG) return;
    queueWrite(characteristicG, value);
};

const handleInputB = async () => {
    const value = parseInt($b.value);
    $bValue.textContent = value;
    updateColorPreview();

    if (!isConnected || !characteristicB) return;
    queueWrite(characteristicB, value);
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

init();