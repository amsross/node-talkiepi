'use strict';
const util = require('util');
const events = require('events');
const Gpio = require('onoff').Gpio;

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
  const led = new Gpio(pinValue, 'out');

  // the current value
  var raw = 0;
  led.writeSync(raw);

  const intensity = options.intensity || 100;

  Object.defineProperties(this, {
    on: {
      value: () => {
        raw = 1;
        led.writeSync(raw);
      },
    },
    off: {
      value: () => {
        raw = 0;
        led.writeSync(raw);
      },
    },
    tearDown: {
      value: () => {
        this.off();
        //led.unexport();
      },
    },
  });
}
