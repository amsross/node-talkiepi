const util = require("util");
const events = require("events");
const wpi = require("wiring-pi");
wpi.setup("wpi");

module.exports = SPI;

function SPI( options ) {
  "use strict";

  if (!(this instanceof SPI)) {
    return new SPI(options);
  }

  events.EventEmitter.call(this);

  // which channel on the GPIO?
  const channelValue = typeof options === "object" ? options.channel : options;

  wpi.wiringPiSPISetup(0, 2000000);

  // the current value
  var raw = 0;
  var interval = options.interval || 250;

  // poll the channel for a state change
  var stateInterval = setInterval(() => {
    let data = this.rawValue();

    if (this.value !== data && ((data-5) > this.value || (data+5) < this.value)) {
      this.emit("change", data);
      this.value = data;
    }
  }, interval);

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
    rawValue: {
      value: function() {

        const buffer = new Buffer([0x01, 8 + channelValue << 4, 0x01]);
        wpi.wiringPiSPIDataRW(0, buffer);
        const MSB = buffer[1];
        const LSB = buffer[2];
        const value = ((MSB & 3) << 8) + LSB;

        return value;
      },
    },
  });

  // cleanup on exit
  process.on("SIGUSR2", function () {
    clearInterval(stateInterval);
  });
  process.on("SIGINT", function () {
    clearInterval(stateInterval);
  });

}

util.inherits(SPI, events.EventEmitter);
