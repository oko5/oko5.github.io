#include <SPI.h>
#include <nRF24L01.h>
#include <RF24.h>

RF24 radio(9, 10);

const byte address[6] = "NODE1";

struct Payload {
  uint32_t counter;
  uint8_t dummy[28];
} __attribute__((packed));

Payload data;
uint32_t counter = 0;

void setup() {
  radio.begin();

  // MAX SPEED SETTINGS
  radio.setChannel(13);
  radio.setDataRate(RF24_2MBPS);
  radio.setPALevel(RF24_PA_MAX);

  radio.setAutoAck(false);
  radio.setRetries(0, 0);
  radio.disableCRC();

  radio.setPayloadSize(32);   // fixed-size = faster
  radio.openWritingPipe(address);
  radio.stopListening();

  // flush buffers
  radio.flush_tx();
}

void loop() {
  data.counter = counter++;

  // faster fill (no loop overhead)
  uint8_t *p = data.dummy;
  uint8_t v = counter;

  for (int i = 0; i < 28; i++) {
    p[i] = v + i;
  }

  // BLOCKING FAST SEND (no buffering delays)
  while (!radio.write(&data, 32)) {
    radio.flush_tx(); // recover instantly if full
  }
}
