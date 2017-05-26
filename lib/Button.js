"use strict";
const util = require("util");
const events = require("events");
const wpi = require("wiringpi-node");
wpi.setup("wpi");

module.exports = Button;

function Button( options ) {

  if (!(this instanceof Button)) {
    return new Button(options);
  }

  events.EventEmitter.call(this);

  // which pin on the GPIO?
  const pinValue = typeof options === "object" ? options.pin : options;

  // set the pin as an input
  wpi.pinMode(pinValue, wpi.INPUT);

  // the current value
  var raw = wpi.digitalRead(pinValue);
  var invert = options.invert || false;
  var interval = options.interval || 250;
  var downValue = 1;
  var upValue = 0;

  // reverse everything if specified
  if (invert) {
    downValue = +!downValue;
    upValue = +!upValue;
  }

  // poll the pin for a state change
  var stateInterval = setInterval(() => {
    let data = wpi.digitalRead(pinValue);

    if (this.value !== data) {
      if (this.isDown(data)) this.emit("down")
      else if (!this.isDown(data)) this.emit("up");
      this.value = data;
    }
  }, interval);

  Object.defineProperties(this, {
    // get the current value
    value: {
      get: () => {
        return Number(raw);
      },
      set: value => {
        raw = Number(value);
      },
    },
    // is the passed value the down value?
    isDown: {
      value: (raw) => {
        return raw === downValue;
      },
    },
    tearDown: {
      value: () => {
        return clearInterval(stateInterval);
      },
    },
  });

};

util.inherits(Button, events.EventEmitter);
