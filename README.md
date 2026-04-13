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


```javascript

```


