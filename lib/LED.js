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

  Object.defineProperties(this, {
    // get the current value
    value: {
      get: () => {
        return Number(raw);
      },
      set: function(value) {
        raw = Number(value);
      },
    },
    isOn: {
      get: () => {
        return !!this.value;
      }
    },
    on: {
      value: () => {
        raw = 1;
        wpi.digitalWrite(pinValue, raw);
      },
    },
    off: {
      value: () => {
        raw = 0;
        wpi.digitalWrite(pinValue, raw);
      },
    },
    tearDown: {
      value: () => {
        this.off();
      },
    },
  });

}
