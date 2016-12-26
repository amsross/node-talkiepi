const util = require("util");
const events = require("events");
const h = require("highland");
const r = require("ramda");
const mic = require("mic");
// const SPI = require("./SPI");
const Button = require("./Button");
const LED = require("./LED");

module.exports = TalkiePi;

function TalkiePi( options ) {

  if (!(this instanceof TalkiePi)) {
    return new TalkiePi(options);
  }

  events.EventEmitter.call(this);

  this.client = options.client;

  this.ledTransmit = this.ledTransmit || new LED(2);
  this.ledReceive = this.ledReceive || new LED(3);

  this.buttonSPST = this.buttonSPST || new Button({
    invert: true,
    pin: 7,
  });

  // this.ledChannel1 = this.ledChannel1 || new LED(21);
  // this.ledChannel2 = this.ledChannel2 || new LED(22);
  // this.ledChannel3 = this.ledChannel3 || new LED(23);
  // this.ledChannel4 = this.ledChannel4 || new LED(24);
  // this.ledChannel5 = this.ledChannel5 || new LED(25);

  // this.ledChannels = this.ledChannels || [
  //   this.ledChannel1,
  //   this.ledChannel2,
  //   this.ledChannel3,
  //   this.ledChannel4,
  //   this.ledChannel5,
  // ];

  // this.spiChannel = this.spiChannel || new SPI({
  //   channel: 0,
  // });

  this.micInstance = mic({
    "rate": "48000",
    "channels": "1",
    "debug": true
  });
  this.micInstance.start();

  this.init();
}

TalkiePi.prototype.init = function() {

  // cleanup on exit
  process.on("SIGUSR2", () => {
    this.tearDown();
  });
  process.on("SIGINT", () => {
    this.tearDown();
  });

  this.client.removeListener("voice-start", this.receiveStart.bind(this));
  this.client.removeListener("voice-end", this.receiveStop.bind(this));
  this.client.on("voice-start", this.receiveStart.bind(this));
  this.client.on("voice-end", this.receiveStop.bind(this));

  const micInputStream = this.micInstance.getAudioStream();

  // send any mic input to mumble while button is down
  h(micInputStream)
    .tap(this.transmitStop.bind(this))
    .filter(x => {
      return this.buttonSPST.isDown(this.buttonSPST.value);
    })
    .tap(this.transmitStart.bind(this))
    .pipe(this.client.inputStream({
      channels: 1,
      sampleRate: 48000,
    }));
};

TalkiePi.prototype.transmitStart = function() {
  h.log("talkiepi: transmitStart");
  return this.ledTransmit.on();
};
TalkiePi.prototype.transmitStop = function() {
  h.log("talkiepi: transmitStop");
  return this.ledTransmit.off();
};
TalkiePi.prototype.receiveStart = function() {
  h.log("talkiepi: receiveStart");
  return this.ledReceive.on();
};
TalkiePi.prototype.receiveStop = function() {
  h.log("talkiepi: receiveStop");
  return this.ledReceive.off();
};

TalkiePi.prototype.tearDown = function tearDown() {
  h.log("talkiepi: tearDown");

  // cleanup on exit
  this.client.disconnect();
  r.map(r.invoker(0, "tearDown"), [
        this.buttonSPST,
        // this.spiChannel,
        this.ledTransmit,
        this.ledReceive,
        // this.ledChannels,
  ]);
};

util.inherits(TalkiePi, events.EventEmitter);
