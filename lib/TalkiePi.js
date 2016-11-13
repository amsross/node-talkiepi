const util = require("util");
const events = require("events");
const SPI = require("./SPI");
const Button = require("./Button");
const LED = require("./LED");

module.exports = TalkiePi;

function TalkiePi( options ) {

  if (!(this instanceof TalkiePi)) {
    return new TalkiePi(options);
  }

  this.client = options.client;

  events.EventEmitter.call(this);

  this.init();
}

TalkiePi.prototype.init = function() {

  this.ledTransmit = this.ledTransmit || new LED(2);
  this.ledReceive = this.LedReceive || new LED(3);

  this.ledChannel1 = this.ledChannel1 || new LED(21);
  this.ledChannel2 = this.ledChannel2 || new LED(22);
  this.ledChannel3 = this.ledChannel3 || new LED(23);
  this.ledChannel4 = this.ledChannel4 || new LED(24);
  this.ledChannel5 = this.ledChannel5 || new LED(25);

  this.ledChannels = this.ledChannels || [
    this.ledChannel1,
    this.ledChannel2,
    this.ledChannel3,
    this.ledChannel4,
    this.ledChannel5,
  ];

  this.spiChannel = this.spiChannel || new SPI({
    channel: 0,
    interval: interval,
  });

  this.buttonSPST = this.buttonSPST || new Button({
    pin: 7,
    interval: interval,
  });

  this.client.removeListener("voice-start", this.receiveStart.bind(this));
  this.client.removeListener("voice-end", this.receiveStop.bind(this));
  this.client.on("voice-start", this.receiveStart.bind(this));
  this.client.on("voice-end", this.receiveStop.bind(this));

  this.buttonSPST.removeListener("down", this.emit.bind(this, "down"));
  this.buttonSPST.removeListener("up", this.emit.bind(this, "up"));
  this.buttonSPST.on("down", this.emit.bind(this, "down"));
  this.buttonSPST.on("up", this.emit.bind(this, "up"));
};

TalkiePi.prototype.transmitStart = function() {
  return this.ledTransmit.on();
};
TalkiePi.prototype.transmitStop = function() {
  return this.ledTransmit.off();
};
TalkiePi.prototype.receiveStart = function() {
  return this.ledReceive.on();
};
TalkiePi.prototype.receiveStop = function() {
  return this.ledReceive.off();
};

TalkiePi.prototype.tearDown = function tearDown() {

  // cleanup on exit
  this.client.disconnect();
  _.invoke(_.flatten([
        this.buttonSPST,
        this.spiChannel,
        this.ledTransmit,
        this.ledReceive,
        this.ledChannels,
  ]), "emit", ["teardown"]);
};

util.inherits(TalkiePi, events.EventEmitter);
