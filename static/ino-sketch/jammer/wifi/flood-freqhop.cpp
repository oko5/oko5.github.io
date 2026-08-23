#include <SPI.h>
#include <nRF24L01.h>
#include <RF24.h>

RF24 radio(9, 10);

const uint8_t chTX[] = {76, 78, 79, 30};
const uint8_t chCount = 4;

uint8_t chIndex = 0;

struct Payload {
  uint32_t counter;
  uint8_t dummy[28];
} __attribute__((packed));

Payload data;
uint32_t counter = 0;

void setup() {
  radio.begin();

  radio.setDataRate(RF24_2MBPS);
  radio.setPALevel(RF24_PA_MAX);

  radio.setAutoAck(false);
  radio.setRetries(0, 0);
  radio.disableCRC();

  radio.setPayloadSize(32);
  radio.openWritingPipe("NODE1");
  radio.stopListening();

  radio.setChannel(chTX[0]);
}

inline void hop() {
  chIndex++;
  if (chIndex >= chCount) chIndex = 0;
  radio.setChannel(chTX[chIndex]);
}

void loop() {

  data.counter = counter++;

  uint8_t v = counter;
  for (uint8_t i = 0; i < 28; i++) {
    data.dummy[i] = v + i;
  }

  // fastest non-blocking transmit
  radio.startWrite(&data, 32, true);

  // WAIT ONLY FOR TX COMPLETE FLAG (no polling waste)
  while (!radio.txStandBy()) {
    // hardware waiting only
  }

  // hop immediately after TX done
  hop();
}
