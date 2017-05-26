"use strict";
const util = require("util");
const events = require("events");
const h = require("highland");
const r = require("ramda");
const mic = require("mic");
const Button = require("./Button");
const LED = require("./LED");

module.exports = TalkiePi;

util.inherits(TalkiePi, events.EventEmitter);
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

  this.init();
}

TalkiePi.prototype.init = function() {

  // cleanup on exit
  process.on("SIGUSR2", () => this.tearDown());
  process.on("SIGINT", () => this.tearDown());

  this.client.removeListener("error", this._onError.bind(this));
  this.client.on("error", this._onError.bind(this));

  this.client.removeListener("disconnect", this._onDisconnect.bind(this));
  this.client.on("disconnect", this._onDisconnect.bind(this));

  this.client.removeListener("voice-start", this.receiveStart.bind(this));
  this.client.removeListener("voice-end", this.receiveStop.bind(this));
  this.client.on("voice-start", this.receiveStart.bind(this));
  this.client.on("voice-end", this.receiveStop.bind(this));

  // send any mic input to mumble while button is down
  h("down", this.buttonSPST)
    .tap(this.transmitStart.bind(this))
    .each(() => {

      this.micInstance = mic({
        "rate": 48000,
        "channels": 1,
        "debug": false,
      });

      this.micInstance.getAudioStream()
        .pipe(this.client.inputStream({
          "channels": 1,
          "sampleRate": 48000,
        }));

      this.micInstance.start();
    });

  // stop everything when button is released
  h("up", this.buttonSPST)
    .tap(this.transmitStop.bind(this))
    .each(() => this.micInstance.stop());

};

TalkiePi.prototype._onError = function(err) {
  this.emit("say", `mumble error: ${err}`);
};

TalkiePi.prototype._onDisconnect = function() {
  this.emit("say", "mumble disconnect");
  this.tearDown();
  process.exit(1);
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
  this.emit("say", "tearDown");

  this.buttonSPST.tearDown()
  this.ledTransmit.tearDown()
  this.ledReceive.tearDown()
};
