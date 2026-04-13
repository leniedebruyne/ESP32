/*==============================
  RGB LED Control
==============================*/

const $r = document.getElementById("r");
const $g = document.getElementById("g");
const $b = document.getElementById("b");
const $rValue = document.getElementById("rValue");
const $gValue = document.getElementById("gValue");
const $bValue = document.getElementById("bValue");
const $colorPreview = document.getElementById("colorPreview");

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

const updateColorPreview = () => {
    const r = parseInt($r.value);
    const g = parseInt($g.value);
    const b = parseInt($b.value);
    $colorPreview.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
};

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

const sendRgbIfConnected = (r, g, b) => {
    if (!isConnected) return;

    if (characteristicR) queueWrite(characteristicR, r);
    if (characteristicG) queueWrite(characteristicG, g);
    if (characteristicB) queueWrite(characteristicB, b);
};

const setLedRed = () => {
    setRgbValues(255, 0, 0);
    sendRgbIfConnected(255, 0, 0);
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

const initRgbControl = () => {
    if (!$r || !$g || !$b || !$colorPreview) return;

    setLedRed();
    $r.addEventListener("input", handleInputR);
    $g.addEventListener("input", handleInputG);
    $b.addEventListener("input", handleInputB);

    window.addEventListener('esp32-connection-change', (event) => {
        if (event?.detail?.isConnected) {
            setLedRed();
        }
    });
};

initRgbControl();