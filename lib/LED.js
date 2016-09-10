const util = require("util");
const events = require("events");
const wpi = require("wiring-pi");
wpi.setup("wpi");

util.inherits(LED, events.EventEmitter);

module.exports = LED;

function LED( options ) {
  "use strict";

  if (!(this instanceof LED)) {
    return new LED(options);
  }

  events.EventEmitter.call(this);

  // which pin on the GPIO?
  const pinValue = typeof options === "object" ? options.pin : options;

  // set the pin as an input
  wpi.pinMode(pinValue, wpi.OUTPUT);

  // the current value
  var raw = 0;
  wpi.digitalWrite(pinValue, raw);

  const intensity = options.intensity || 100;
  // any running setInterval
  var interval;

  Object.defineProperties(this, {
    // get the current value
    value: {
      get: function() {
        return Number(raw);
      },
      set: function(value) {
        raw = Number(value);
      },
    },
    // blink interval
    interval: {
      get: function() {
        return interval;
      },
      set: function(value) {
        interval = value;
      },
    },
    isOn: {
      get: function() {
        return !!this.value;
      }
    },
    on: {
      value: function() {
        raw = 1;
        wpi.digitalWrite(pinValue, raw);
      },
    },
    off: {
      value: function() {
        raw = 0;
        wpi.digitalWrite(pinValue, raw);
      },
    },
  });

  // cleanup on exit
  process.on("SIGUSR2", () => {
    if (this.interval) clearInterval(this.interval);
    this.off();
  });
  process.on("SIGINT", () => {
    if (this.interval) clearInterval(this.interval);
    this.off();
  });
}

LED.prototype.blink = function blink(interval) {
  if (this.interval) clearInterval(this.interval);
  this.interval = setInterval(() => {
    this.isOn ? this.off() : this.on();
  }, interval || 500);
};

LED.prototype.strobe = function strobe(interval) {
  this.blink(interval || 50);
};