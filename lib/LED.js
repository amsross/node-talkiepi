'use strict';
const util = require('util');
const events = require('events');
const wpi = require("wiring-pi");
wpi.setup("wpi");

util.inherits(LED, events.EventEmitter);

module.exports = LED;

function LED( options ) {
  if (!(this instanceof LED)) {
    return new LED(options);
  }

  events.EventEmitter.call(this);

  // which pin on the GPIO?
  const pinValue = typeof options === 'object' ? options.pin : options;

  // set the pin as an input
  wpi.pinMode(pinValue, wpi.OUTPUT);

  // the current value
  wpi.digitalWrite(pinValue, 0);

  const intensity = options.intensity || 100;

  Object.defineProperties(this, {
    on: {
      value: () => wpi.digitalWrite(pinValue, 1)
    },
    off: {
      value: () => wpi.digitalWrite(pinValue, 0)
    },
    tearDown: {
      value: () => this.off()
    },
  });

}
