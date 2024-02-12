#include <PubSubClient.h>
#include <WiFiS3.h>
#include <Adafruit_PN532.h>
#include <Secrets.h>

// If using the breakout with SPI, define the pins for SPI communication.
#define PN532_SCK  (2)
#define PN532_MOSI (3)
#define PN532_SS   (4)
#define PN532_MISO (5)

// If using the breakout or shield with I2C, define just the pins connected
// to the IRQ and reset lines.  Use the values below (2, 3) for the shield!
#define PN532_IRQ   (2)
#define PN532_RESET (3)  // Not connected by default on the NFC Shield

// Declare NFC shield with an I2C connection:
Adafruit_PN532 nfc(PN532_IRQ, PN532_RESET);

// SSID/Password combination for your WiFi
char* ssid = SECRET_SSID;
char* password = SECRET_PASS;

// MQTT Broker IP address
const char* mqtt_server = "192.168.0.117";

WiFiClient espClient;
PubSubClient client(espClient);

// Function to read or write to card and publish to MQTT
void read_or_write_to_card(bool success, uint8_t* uid, uint8_t uidLength, bool write = false, uint8_t* nameId = NULL) {
  if (success) {
    // Display some basic information about the card
    Serial.println("Found an ISO14443A card");
    Serial.print("  UID Length: ");
    Serial.print(uidLength, DEC);
    Serial.println(" bytes");
    Serial.print("  UID Value: ");
    nfc.PrintHex(uid, uidLength);
    Serial.println("");

    if (uidLength == 4)
    {
      // We probably have a Mifare Classic card ...
      Serial.println("Seems to be a Mifare Classic card (4 byte UID)");

      // Now we need to try to authenticate it for read/write access
      // Try with the factory default KeyA: 0xFF 0xFF 0xFF 0xFF 0xFF 0xFF
      Serial.println("Trying to authenticate block 4 with default KEYA value");
      uint8_t keya[6] = { 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF };

      // Start with block 4 (the first block of sector 1) since sector 0
      // contains the manufacturer data and it's probably better just
      // to leave it alone unless you know what you're doing
      success = nfc.mifareclassic_AuthenticateBlock(uid, uidLength, 4, 0, keya);

      if (success)
      {
        Serial.println("Sector 1 (Blocks 4..7) has been authenticated");
        uint8_t data[16];

        if (write)
        {
          // Data to write to the card
          memcpy(data, nameId, sizeof(data));
          success = nfc.mifareclassic_WriteDataBlock(4, data);

          if (success) 
          {
            Serial.println("Data written to block 4");

            String dataString(reinterpret_cast<char*>(data), 16); // Convert data array to a string
            const char* dataChar = dataString.c_str(); // Convert dataString to const char*
            client.publish("esp32/name/card/confirm", dataChar); // Publish the string
            delay(1000);
          }
          else
          {
            Serial.println("Ooops ... unable to write the requested block.  Try another key?");
          }
        }
        else
        {
          // Try to read the contents of block 4
          success = nfc.mifareclassic_ReadDataBlock(4, data);

          if (success)
          {
            // Data seems to have been read ... spit it out
            Serial.println("Reading Block 4:");
            nfc.PrintHexChar(data, 16);
            Serial.println("");
            String dataString(reinterpret_cast<char*>(data), 16); // Convert data array to a string
            const char* dataChar = dataString.c_str(); // Convert dataString to const char*
            client.publish("esp32/attendant", dataChar); // Publish the string
            Serial.println("Reading Block 4:");

            // Wait a bit before reading the card again
            delay(1000);
          }
          else
          {
            Serial.println("Ooops ... unable to read the requested block.  Try another key?");
          }
        }
      }
      else
      {
        Serial.println("Ooops ... authentication failed: Try another key?");
      }
    }
  }
}

// Function to connect to WIFI
void setup_wifi() {
  delay(10);
  // We start by connecting to a WiFi network
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

// Callback function header for MQTT messages
void callback(char* topic, byte* message, unsigned int length) {
  Serial.print("Message arrived on topic: ");
  Serial.print(topic);
  Serial.print(". Message: ");
  String messageTemp;
  uint8_t data[16];
  
  for (int i = 0; i < 16; i++) {
    if (i < length)
    {
      data[i] = (uint8_t)message[i];
    }
    else
    {
      data[i] = 0;
    }
    messageTemp += (char)data[i];

  }
  Serial.println();

  // Print the message
  if (String(topic) == "api/name/create")
  {
    uint8_t success;
    uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0 };  // Buffer to store the returned UID
    uint8_t uidLength;                        // Length of the UID (4 or 7 bytes depending on ISO14443A card type)
    Serial.println("creating name ");
    Serial.println(messageTemp);
    Serial.println("Waiting for an ISO14443A Card ...");
    // Wait for an ISO14443A type cards (Mifare, etc.).  When one is found
    success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength);

    read_or_write_to_card(success, uid, uidLength, true, data);
  }
}

// Reconnect to MQTT if connection is lost
void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (client.connect("ESP8266Client", "admin", "Datait2024!")) {
      Serial.println("connected");
      // Subscribe
      client.subscribe("esp32/output");
      client.subscribe("api/name/create");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

// Main function
void setup(void) {
  Serial.begin(115200);
  while (!Serial) delay(10); // for Leonardo/Micro/Zero

  Serial.println("Hello!");

  nfc.begin();

  uint32_t versiondata = nfc.getFirmwareVersion();
  if (! versiondata) {
    Serial.print("Didn't find PN53x board");
    while (1); // halt
  }
  
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);

  // Got ok data, print it out!
  Serial.print("Found chip PN5"); Serial.println((versiondata>>24) & 0xFF, HEX);
  Serial.print("Firmware ver. "); Serial.print((versiondata>>16) & 0xFF, DEC);
  Serial.print('.'); Serial.println((versiondata>>8) & 0xFF, DEC);

  Serial.println("Waiting for an ISO14443A Card ...");
}

// Loop function
void loop(void) {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  uint8_t success;
  uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0 };  // Buffer to store the returned UID
  uint8_t uidLength;                        // Length of the UID (4 or 7 bytes depending on ISO14443A card type)

  // Wait for an ISO14443A type cards (Mifare, etc.).  When one is found
  // 'uid' will be populated with the UID, and uidLength will indicate
  // if the uid is 4 bytes (Mifare Classic) or 7 bytes (Mifare Ultralight)
  success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 200);

  read_or_write_to_card(success, uid, uidLength);
}