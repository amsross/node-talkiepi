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
}

TalkiePi.protoype.init = function() {

  this.ledTransmit = new LED(2);
  this.ledReceive = new LED(3);

  this.ledChannel1 = new LED(21);
  this.ledChannel2 = new LED(22);
  this.ledChannel3 = new LED(23);
  this.ledChannel4 = new LED(24);
  this.ledChannel5 = new LED(25);

  this.ledChannels = [
    ledChannel1,
    ledChannel2,
    ledChannel3,
    ledChannel4,
    ledChannel5,
  ];

  this.spiChannel = new SPI({
    channel: 0,
    interval: interval,
  });

  this.buttonSPST = new Button({
    pin: 7,
    interval: interval,
  });

  this.client.on("voice-start", this.ledReceive.on.bind(ledReceive));
  this.client.on("voice-end", this.ledReceive.off.bind(ledReceive));
};

TalkiePi.protoype.tearDown = function tearDown() {

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
