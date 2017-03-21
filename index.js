"use strict";
process.setMaxListeners(0);

const h = require("highland");
const mumble = require("mumble");
const Speaker = require("speaker");
const TalkiePi = require("./lib/TalkiePi");
// const SPI = require("./lib/SPI");
const Button = require("./lib/Button");
const LED = require("./lib/LED");
const options = require("./options");
const interval = 500;

function say(phrase) {
  h.log("talkiepi: say:", phrase);
}

// attempt to connect to mumble
mumble.connect( options.server || "localhost", (err, client) => {
  if (err) throw new Error( err );

  client.authenticate(options.username, options.password);
  client.on("initialized", start.bind(null, client));
});

function start(client) {

  const talkiePi = new TalkiePi({client: client});

  // this.talkiePi.spiChannel.on("change", value => {

  //   // how many values constitute a single LED
  //   const width = Math.ceil(1024 / this.talkiePi.ledChannels.length);
  //   // which LED is current selected
  //   const led = Math.floor(value / width);

  //   // turn off all of the channel LEDs
  //   r.map(r.invoker(0, "off"), this.talkiePi.ledChannels);
  //   // turn the selected LED on
  //   this.talkiePi.ledChannels[led].on();
  // });

  // create a speaker to send audio to
  const speaker = new Speaker({
    channels: 1,
    bitDepth: 16,
    sampleRate: 44100,
  });
  speaker.on("error", h.log.bind(h, "speaker error:"));
  // pipe mumble audio directly to the speaker
  client.outputStream().pipe(speaker);

  say("Ready!");
}
