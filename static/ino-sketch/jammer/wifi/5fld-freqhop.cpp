#include <SPI.h>
#include <nRF24L01.h>
#include <RF24.h>

RF24 radio(9, 10);

// ======================
// SET THIS PER DEVICE
// 0,1,2,3,4 for each Arduino
// ======================
#define NODE_ID 0

// ======================
// Unique addresses per node
// ======================
const byte addresses[5][6] = {
  "NODE1",
  "NODE2",
  "NODE3",
  "NODE4",
  "NODE5"
};

// ======================
// Individual channel arrays per node
// ======================
uint8_t channelsNode1[] = {1, 2, 3, 4, 5};
uint8_t channelsNode2[] = {10, 11, 12, 13, 14};
uint8_t channelsNode3[] = {20, 21, 22, 23, 24};
uint8_t channelsNode4[] = {40, 41, 42, 43, 44};
uint8_t channelsNode5[] = {80, 81, 82, 83, 84};

// Pointer table to select correct array
uint8_t* channelSets[5] = {
  channelsNode1,
  channelsNode2,
  channelsNode3,
  channelsNode4,
  channelsNode5
};

// Size of each array (all same length here)
const uint8_t CHANNEL_COUNT = 5;

struct Payload {
  uint32_t counter;
  uint8_t nodeId;
  uint8_t data[27];
};

Payload payload;
uint32_t counter = 0;

void setup() {
  radio.begin();

  radio.setDataRate(RF24_2MBPS);
  radio.setPALevel(RF24_PA_MAX);
  radio.setAutoAck(false);

  radio.stopListening();

  radio.openWritingPipe(addresses[NODE_ID]);

  payload.nodeId = NODE_ID;
  payload.counter = 0;
}

void loop() {

  uint8_t* channels = channelSets[NODE_ID];

  for (int i = 0; i < CHANNEL_COUNT; i++) {

    radio.setChannel(channels[i]);

    payload.counter++;

    for (int j = 0; j < 27; j++) {
      payload.data[j] = j + NODE_ID;
    }

    radio.write(&payload, sizeof(payload));

    delayMicroseconds(300); // fast per-channel burst
  }
}
