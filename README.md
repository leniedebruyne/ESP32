# ESP32 opdracht
Voor deze opdracht moet ik een javascript experience koppelen met een ESP32 bord. Het is de bedoeling dat ik zowel input als output krijg.
Voor de opdracht mocht ik verder werken op mijn vorig concept, dit heb ik dus ook gedaan.

## Concept
Voor mijn concept zal je op je computer een paar elementen zien: je zal wolkjes zien bewegen, random vogels die worden gespawnt en de ballon.
In de ui zie je je score, timer, highscore en hoe snel en groot de ballon is.

Het is de bedoeling dat je zo lang mogelijk blijft leven, dit doe je door ervoor te zorgen dat de vogels de ballon niet raken. Je kan dit doen door de ballon op te schuiven, of kleiner en groter te maken.
Je hebt in totaal 3 levens, nadat je geen levens meer hebt is het spel afgelopen en moet je opnieuw beginnen.

## Start
Ik ben gestart van uit de "esp32-web-serial-potmeter-rgbled". In deze oefening was er al een bluetooth connectie aanwezig en een input en output. Dit was handig voor het opstarten van mijn opdracht. Het rgb ledje kon ik laten staan, al zal ik de code wel wat moeten veranderen. De potentiometer heb ik als test vervangen door 2 knoppen, 1 knop voor de ballon naar links te sturen, en 1 knop om de ballon naar rechts te sturen.

Dit is tot nu toe de arduino code:
```javascript
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>

#define DEVICE_NAME "Lenie_Debruyne"

// UUIDs
#define SERVICE_UUID               "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
#define CHARACTERISTIC_UUID_R      "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
#define CHARACTERISTIC_UUID_G      "6e400003-b5a3-f393-e0a9-e50e24dcca9e"
#define CHARACTERISTIC_UUID_B      "6e400004-b5a3-f393-e0a9-e50e24dcca9e"
#define CHARACTERISTIC_BUTTON_UUID "6e400006-b5a3-f393-e0a9-e50e24dcca9e"

// Pins
const int leftButtonPin = 21;
const int rightButtonPin = 18;
const int redPin = 4;
const int greenPin = 5;
const int bluePin = 6;

BLEServer *pServer = nullptr;
BLECharacteristic *pCharacteristicButton = nullptr;

bool deviceConnected = false;
bool oldDeviceConnected = false;

// Edge detectie
bool lastLeftState = HIGH;
bool lastRightState = HIGH;

unsigned long previousMillis = 0;
const unsigned long interval = 50; // update interval

// BLE Callbacks
class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *pServer) { deviceConnected = true; Serial.println("Device connected"); }
  void onDisconnect(BLEServer *pServer) { deviceConnected = false; Serial.println("Device disconnected"); }
};

// RGB callbacks
class RedCallback : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    String rxValue = pCharacteristic->getValue();
    if (rxValue.length() > 0) analogWrite(redPin, (uint8_t)rxValue[0]);
  }
};

class GreenCallback : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    String rxValue = pCharacteristic->getValue();
    if (rxValue.length() > 0) analogWrite(greenPin, (uint8_t)rxValue[0]);
  }
};

class BlueCallback : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    String rxValue = pCharacteristic->getValue();
    if (rxValue.length() > 0) analogWrite(bluePin, (uint8_t)rxValue[0]);
  }
};

void setup() {
  Serial.begin(115200);

  pinMode(leftButtonPin, INPUT_PULLUP);
  pinMode(rightButtonPin, INPUT_PULLUP);

  pinMode(redPin, OUTPUT);
  pinMode(greenPin, OUTPUT);
  pinMode(bluePin, OUTPUT);

  BLEDevice::init(DEVICE_NAME);
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);

  BLECharacteristic *pRCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID_R, BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR);
  pRCharacteristic->setCallbacks(new RedCallback());

  BLECharacteristic *pGCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID_G, BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR);
  pGCharacteristic->setCallbacks(new GreenCallback());

  BLECharacteristic *pBCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID_B, BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR);
  pBCharacteristic->setCallbacks(new BlueCallback());

  pCharacteristicButton = pService->createCharacteristic(
    CHARACTERISTIC_BUTTON_UUID, BLECharacteristic::PROPERTY_NOTIFY);

  pService->start();
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  BLEDevice::startAdvertising();
}

void loop() {
  // Knoppen uitlezen
  int leftState = digitalRead(leftButtonPin);
  int rightState = digitalRead(rightButtonPin);

  // Edge detectie: alleen printen als knop net ingedrukt
  if (leftState == LOW && lastLeftState == HIGH) {
    Serial.println("Linkse knop ingedrukt!");
    if (deviceConnected) {
      uint8_t val = 0;
      pCharacteristicButton->setValue(&val, 1);
      pCharacteristicButton->notify();
    }
  }

  if (rightState == LOW && lastRightState == HIGH) {
    Serial.println("Rechtse knop ingedrukt!");
    if (deviceConnected) {
      uint8_t val = 1;
      pCharacteristicButton->setValue(&val, 1);
      pCharacteristicButton->notify();
    }
  }

  // update vorige knopstatus
  lastLeftState = leftState;
  lastRightState = rightState;

  delay(50); // kleine debounce / interval

  // Disconnect/reconnect handling
  if (!deviceConnected && oldDeviceConnected) {
    delay(500);
    BLEDevice::startAdvertising();
    oldDeviceConnected = false;
  }
  if (deviceConnected && !oldDeviceConnected) oldDeviceConnected = true;
}
```

## Naar links en rechts
Nu kunnen we de ballon met een klikje al naar links sturen en met een klikje naar rechts. Het is nu de bedoeling dat als je de knop van links inhoud, de ballon naar links blijft bewegen tot aan de rand van het scherm, dus niet in 1 klik. 
Daarom zal ik wat code moeten veranderen in mijn arduino code, omdat we nu gewoon kijken of de knop word ingedrukt of niet. We zullen om een bepaalde tijd moeten kijken of hij nog steeds ingedrukt is of als er iets veranderd is.

Daarom heb ik mijn arduino code een beetje aangepast, ik heb ervoor gezorgt dat de code elke 50ms kijkt of de knop nog steeds is ingedrukt. Zo ziet mijn arduino code er nu uit:

```javascript
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>

#define DEVICE_NAME "Lenie_Debruyne"

// UUIDs
#define SERVICE_UUID               "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
#define CHARACTERISTIC_UUID_R      "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
#define CHARACTERISTIC_UUID_G      "6e400003-b5a3-f393-e0a9-e50e24dcca9e"
#define CHARACTERISTIC_UUID_B      "6e400004-b5a3-f393-e0a9-e50e24dcca9e"
#define CHARACTERISTIC_BUTTON_UUID "6e400006-b5a3-f393-e0a9-e50e24dcca9e"

// Pins
const int leftButtonPin = 21;
const int rightButtonPin = 18;
const int redPin = 4;
const int greenPin = 5;
const int bluePin = 6;

BLEServer *pServer = nullptr;
BLECharacteristic *pCharacteristicButton = nullptr;

bool deviceConnected = false;
bool oldDeviceConnected = false;

// timing (zonder delay spam)
unsigned long previousMillis = 0;
const unsigned long interval = 50; // elke 50ms sturen

// BLE Callbacks
class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *pServer) { 
    deviceConnected = true; 
    Serial.println("Device connected"); 
  }
  void onDisconnect(BLEServer *pServer) { 
    deviceConnected = false; 
    Serial.println("Device disconnected"); 
  }
};

// RGB callbacks
class RedCallback : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    String rxValue = pCharacteristic->getValue();
    if (rxValue.length() > 0) analogWrite(redPin, (uint8_t)rxValue[0]);
  }
};

class GreenCallback : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    String rxValue = pCharacteristic->getValue();
    if (rxValue.length() > 0) analogWrite(greenPin, (uint8_t)rxValue[0]);
  }
};

class BlueCallback : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    String rxValue = pCharacteristic->getValue();
    if (rxValue.length() > 0) analogWrite(bluePin, (uint8_t)rxValue[0]);
  }
};

void setup() {
  Serial.begin(115200);

  pinMode(leftButtonPin, INPUT_PULLUP);
  pinMode(rightButtonPin, INPUT_PULLUP);

  pinMode(redPin, OUTPUT);
  pinMode(greenPin, OUTPUT);
  pinMode(bluePin, OUTPUT);

  BLEDevice::init(DEVICE_NAME);
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);

  BLECharacteristic *pRCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID_R, BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR);
  pRCharacteristic->setCallbacks(new RedCallback());

  BLECharacteristic *pGCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID_G, BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR);
  pGCharacteristic->setCallbacks(new GreenCallback());

  BLECharacteristic *pBCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID_B, BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR);
  pBCharacteristic->setCallbacks(new BlueCallback());

  pCharacteristicButton = pService->createCharacteristic(
    CHARACTERISTIC_BUTTON_UUID, BLECharacteristic::PROPERTY_NOTIFY);

  pService->start();
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  BLEDevice::startAdvertising();
}

void loop() {
  unsigned long currentMillis = millis();

  // alleen elke 50ms updaten (smooth + niet te spammy)
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;

    int leftState = digitalRead(leftButtonPin);
    int rightState = digitalRead(rightButtonPin);

    if (deviceConnected) {

      // LEFT knop ingedrukt
      if (leftState == LOW) {
        uint8_t val = 0;
        pCharacteristicButton->setValue(&val, 1);
        pCharacteristicButton->notify();
      }

      // RIGHT knop ingedrukt
      else if (rightState == LOW) {
        uint8_t val = 1;
        pCharacteristicButton->setValue(&val, 1);
        pCharacteristicButton->notify();
      }

      //  niks ingedrukt → kan je later gebruiken als STOP
      else {
        uint8_t val = 2;
        pCharacteristicButton->setValue(&val, 1);
        pCharacteristicButton->notify();
      }
    }
  }

  // reconnect handling
  if (!deviceConnected && oldDeviceConnected) {
    delay(500);
    BLEDevice::startAdvertising();
    oldDeviceConnected = false;
  }

  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = true;
  }
}
```

Ook mijn javascript heb ik een beetje moeten aanpassen, ik heb ervoor gezorgt dat als er een updte komt, de ballon oftwel een klein beetje naar links of rechts verplaatst.

```javascript
const moveBalloonLeft = () => {
    balloonPosition -= 5; 
    updateBalloonPosition();
};

const moveBalloonRight = () => {
    balloonPosition += 5;
    updateBalloonPosition();
};
```

En mijn updateBalloonPosition heb ik ook wat aangepast, ik heb grenzen toegevoegd zodat de ballon niet uit het scherm gaat.

```javascript
const updateBalloonPosition = () => {
    if (!$balloonContainer) return;

    // grenzen
    const min = -150;
    const max = 150;

    balloonPosition = Math.max(min, Math.min(max, balloonPosition));

    $balloonContainer.style.transform = `translateX(${balloonPosition}px)`;
};
```

## Ui elementen van het spel toevoegen
Daarna heb ik ervoor gezorgt dat wolken en vogels kunnen spanwnen, maar alleen als het esp bord verbonden is. Ik heb de code van de vorige opdracht hiervoor gekopieerd.


```javascript
const cloudContainer = ensureCloudContainer();
const maxClouds = 4;

const gameArea = document.body;
const balloon = document.querySelector('img[alt="Balloon Control"]')?.parentElement;

let speedMultiplier = 1;
let birdExists = false;
let cloudIntervalId = null;
let birdIntervalId = null;

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

    const topPos = Math.random() * (window.innerHeight * 0.6) + window.innerHeight * 0.1;
    bird.style.top = `${topPos}px`;

    const fromLeft = Math.random() < 0.5;
    let pos = fromLeft ? -BIRD_OFFSCREEN_PADDING : window.innerWidth + BIRD_OFFSCREEN_PADDING;
    const direction = fromLeft ? 1 : -1;

    bird.style.left = pos + 'px';
    bird.style.transform = `scaleX(${fromLeft ? 1 : -1})`;

    const baseSpeed = Math.random() * 3 + 1;

    gameArea.appendChild(bird);

    function animate() {
        if (!isEsp32ConnectionActive()) {
            bird.remove();
            birdExists = false;
            return;
        }

        const step = baseSpeed * speedMultiplier * direction;
        const steps = Math.ceil(Math.abs(step));

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
                    bird.remove();
                    birdExists = false;
                    return;
                }
            }
        }

        if ((direction === 1 && pos > window.innerWidth + BIRD_OFFSCREEN_PADDING) ||
            (direction === -1 && pos < -BIRD_OFFSCREEN_PADDING)) {
            bird.remove();
            birdExists = false;
            return;
        }

        requestAnimationFrame(animate);
    }

    animate();
}

function startAmbientSpawns() {
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
}

function syncAmbientSpawns() {
    if (isEsp32ConnectionActive()) {
        startAmbientSpawns();
    } else {
        stopAmbientSpawns();
    }
}

window.addEventListener('esp32-connection-change', syncAmbientSpawns);
syncAmbientSpawns();

window.setGameSpeedMultiplier = (value) => {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
        speedMultiplier = parsed;
    }
};

```

## Ui van html veranderen
Daarna heb ik ervoor gezorgt dat de ui van het spel op het scherm kwam te staan. Daarvoor heb ik eerst de html van de oefening verwijderd. Deze had ik namelijk niet meer nodig. De enige html die ik heb toegevoegd tot nu toe is de balk bovenaan die laat zien hoe lang je al bezig bent aan het spel, wat het record is en hoeveel levens je nog hebt.

```javascript
 <div class="hud" aria-live="polite">
                    <span class="time">Time: 00:00</span>
                    <span class="best">Best time: 00:00</span>
                    <div class="lives">❤️ ❤️ ❤️</div>
                </div>
```

In de javascript heb ik de best time, time en lives laten werken. Ik heb dit aan ai gevraagd zodat ik daar niet te veel tijd mee verloor, ik had dit namelijk al uitgezogt in de vorige oefening.
voor eventjes zal ik de "disconnect en connected to ..." laten staan, maar later zal ik deze verzetten naar de ui balk die ik later zal toevoegen. 

## RGB led connecten met levens
Ik had al de code dat als je een leven verloor, deze weg ging van de rode hartjes. Ik wou dit nog visueler maken door de rgb led te gebruiken. Dit was het doel:
3 levens = groen
2 levens = oranje
1 leven = rood
0 levens = uit

In de ui.js heb ik een fucntie toegevoegd die de led kan updaten aan de hand van het aantal levens. Dit ziet er zo uit:

```javascript
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
```

Ook vond ik het logischer dat als het bordje gedisconnect was, de led ook niet meer brande. Daarom heb ik aan de disconnect functie de logica toegepast dat als de funcie turnRgbOff bestaat, dat hij de rgb lichten uit zet.


```javascript
const handleClickDisconnect = async () => {
    if (bluetoothDevice && bluetoothDevice.gatt.connected) {

        if (typeof window.turnRgbOff === 'function') {
            window.turnRgbOff();
        }

        await new Promise(resolve => setTimeout(resolve, 100));

        bluetoothDevice.gatt.disconnect();
    }
};
```

## Code opkuisen
Na deze stappen was het tijd om de code eens op te kuisen.
Ik heb alle js files geexporteerd in mijn html files, zodat er geen globale exports meer zijn.

## Knopjes bij voor naar boven en beneden
Na het spelletje een paar keer te spelen merkte ik dat het tog nodig was om de ballon ook naar boven en beneden te kunnen bewegen. Daarom heb ik ervoor gekozen om nog 2 knopjes bij te voegen. Voor de code heb ik gewoon 2 poorten bijgevoegd en daar de up en down button aan gelinkt en die dan ook toegevoegd aan de javascript code. 

## styling begin scherm
Tot nu toe ziet het start scherm er nog basic uit, een button, een beetje feedback en een lucht achtige achtergrond kleur. Ik wil hier een beetje meer een game design aan geven, daarom zal ik dit scherm wat beter maken met css. 

## bug fix border
Tijdens het spelen van het spel had ik door dat de ballon niet tot aan de borders van het scherm kwam, dit was omdat ik de borders tijdelijk gehardcode had, en dit was vergeten. Dit heb ik dus opgelost. 

```javascript
const updateBalloonPosition = () => {
    if (!$balloonContainer) return;

    // Get the game stage container dimensions
    const gameStage = $balloonContainer.parentElement;
    if (!gameStage) return;

    const stageRect = gameStage.getBoundingClientRect();
    const balloonRect = $balloonImg.getBoundingClientRect();

    // Calculate boundaries to allow balloon to touch screen edges
    const balloonWidth = balloonRect.width;
    const balloonHeight = balloonRect.height;
    const stageWidth = stageRect.width;
    const stageHeight = stageRect.height;

    // Calculate max displacement from center
    const maxX = (stageWidth / 2) - (balloonWidth / 2);
    const maxY = (stageHeight / 2) - (balloonHeight / 2);
    const minX = -maxX;
    const minY = -maxY;

    balloonPositionX = Math.max(minX, Math.min(maxX, balloonPositionX));
    balloonPositionY = Math.max(minY, Math.min(maxY, balloonPositionY));
    $balloonContainer.style.transform = `translate(${balloonPositionX}px, ${balloonPositionY}px)`;
};
```

## Game over scherm
Tot nu toe, als je geen levens meer hebt, begint het spel direct opnieuw. Ik wil er voor zorgen dat als je geen levens meer hebt, je even een game over scherm ziet met een timer van 5 secondne die aftelt, voor het spel opnieuw begint.

Als eerste heb ik de overlay van het spel gemaakt. Daar geef ik de html weer en zeg uj welke class hij moet hebben.

```javascript
function ensureGameOverOverlay() {
    let overlay = document.querySelector('.game-over-overlay');

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'game-over-overlay hidden';
        overlay.setAttribute('aria-live', 'assertive');
        overlay.innerHTML = `
            <div class="game-over-content">
                <h2>GAME OVER</h2>
                <p>Restarting in <span class="countdown">5</span>s</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    return overlay;
}
```

Dan zorg ik ervoor dat die overlay getoont kan worden of verborgen.


```javascript
function setGameOverOverlayVisible(isVisible) {
    if (!gameOverOverlay) {
        return;
    }

    gameOverOverlay.classList.toggle('hidden', !isVisible);
}
```

Daarna moest ik ervoor zorgen dat de count down kan updaten. 
```javascript
function updateGameOverCountdown(secondsLeft) {
    if (!gameOverCountdownLabel) {
        return;
    }

    gameOverCountdownLabel.textContent = String(Math.max(0, Math.ceil(secondsLeft)));
}
```

Dan heb ik ook nog een fucntie gemaakt die alle timers opruimt die te maken hebben met het restarten van het spel, zo voorkom ik onnodige bugs.
```javascript
function clearRoundRestartTimers() {
    if (restartTimeoutId !== null) {
        clearTimeout(restartTimeoutId);
        restartTimeoutId = null;
    }

    if (restartCountdownIntervalId !== null) {
        clearInterval(restartCountdownIntervalId);
        restartCountdownIntervalId = null;
    }
}
```

Dan heb ik een fucntie die kijkt of de game klaar is om gespeeld te worden. Als er een connectie is, en de speler nog levens geeft komt er niks, anders komt de overlay.

```javascript
function isGameplayActive() {
    return isEsp32ConnectionActive() && !isGameOverCountdownActive && lives > 0;
}
```

En als laatste heb ik een fucntie die de game restart. Dit houd in dat hij de oude timers reset, overlay, .... .

```javascript
function startGameOverCountdown() {
    clearRoundRestartTimers();
    isGameOverCountdownActive = true;

    let remainingSeconds = GAME_OVER_COUNTDOWN_SECONDS;
    updateGameOverCountdown(remainingSeconds);
    setGameOverOverlayVisible(true);

    restartCountdownIntervalId = setInterval(() => {
        remainingSeconds -= 1;
        updateGameOverCountdown(remainingSeconds);
    }, 1000);

    restartTimeoutId = setTimeout(() => {
        clearRoundRestartTimers();
        setGameOverOverlayVisible(false);
        isGameOverCountdownActive = false;

        if (!isEsp32ConnectionActive()) {
            return;
        }

        beginRound();
        startAmbientSpawns();
    }, GAME_OVER_COUNTDOWN_SECONDS * 1000);
}

```

## Botsing
Als volgende wil ik ervoor zorgen dat als er een botsing gebeurd tussen de vogel en de ballon, er een geluid afgaat. ik heb eerst wat onderzoek gedaan tussen het verschil van een active en passive buzzer, zodat ik weet welke ik wil gaan gebruiken.

- Active buzzer: Geeft direct geluid als je het aansluit maar heeft niet veel controle.
- Passive buzzer: Hier heb je veel controle mee en kan je dus ook melodietjes spelen.

Omdat ik graag wat meer controle wil over het geluid heb ik besloten om een passive buzzer te gebruiken. Het volgende dat ik heb onderzocht is hoe ik hem kan aanlsuiten. 

Ik ben begonnen met het maken van een test code, zodat ik kon testen hoe de logica van de code werkte en of mijn pieper werkt. 

```javascript
const int buzzerPin = 19;

void setup() {
}

void loop() {
  tone(buzzerPin, 2500);
  delay(200);

  noTone(buzzerPin);
  delay(500);
}
```

Dit werkte goed maar natuurlijk bleef het geluid nu in een loop afspelen. Het is de bedoeling dat pas als er een bosting gebeurd, de piep afspeelt. Daarom heb ik mijn arduino gelinkt aan mijn javascript logica. Dit is de code die ik nu in arduino heb:

```javascript
#define CHARACTERISTIC_BUZZER_UUID  "6e400007-b5a3-f393-e0a9-e50e24dcca9e"

class BuzzerCallback : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    String value = pCharacteristic->getValue();

    if (value.length() > 0 && value[0] == 1) {
      tone(buzzerPin, 2500); 
      delay(150);            
      noTone(buzzerPin);
    }
  }
};

BLECharacteristic *pBuzzerCharacteristic = pService->createCharacteristic(
  CHARACTERISTIC_BUZZER_UUID,
  BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR
);

pBuzzerCharacteristic->setCallbacks(new BuzzerCallback());

```

Daarna moest ik een paar dingetjes aanpassen in mijn js files om dit te laten werken. Ik ben begonnen in de connection.js, daar heb ik mijn buzzer toegevoegd:

```javascript
let characteristicBuzzer = null;
export const getBuzzerCharacteristic = () => characteristicBuzzer;
const CHARACTERISTIC_BUZZER_UUID = '6e400007-b5a3-f393-e0a9-e50e24dcca9e';

        try {
            characteristicBuzzer = await service.getCharacteristic(CHARACTERISTIC_BUZZER_UUID);
            console.log('Buzzer characteristic found');
        } catch (error) {
            characteristicBuzzer = null;
            console.warn('Buzzer characteristic not available on device yet.');
        }

            characteristicBuzzer = null;

```

Daarna heb ik een js bestandje bijgemaakt voor de logica van de buzzer, genaamd buzzer-logic:

mijn code kijkt of je verbonden bent, of het niet te snel piept achter elkaar, dan stuurt het een signaal naar de buzzer en doe dat in een wachtrij zodat er geen spam word gemaakt.

```javascript
/*==============================
  Buzzer Logic
==============================*/

import { getBuzzerCharacteristic, isEsp32Connected } from './connection.js';

const COLLISION_BUZZER_VALUE = 1;
const COLLISION_COOLDOWN_MS = 350;

let lastCollisionBuzzAt = 0;
let writeQueue = Promise.resolve();

const queueWrite = (characteristic, value) => {
    writeQueue = writeQueue.then(async () => {
        try {
            await characteristic.writeValueWithoutResponse(new Uint8Array([value]));
        } catch (error) {
            console.error('Buzzer write failed:', error);
        }
    });
};

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

```

En als laatste trigger ik de "triggerCollisionBuzzer();" functie als er een bosting gebeurd.


## Extra hartjes 

## Extra schildjes

## Boost




```javascript

```
