"use strict";
process.setMaxListeners(0);

const stream = require("stream");
const _ = require("lodash");
const h = require("highland");
const mumble = require("mumble");
const mic = require("mic");
const Speaker = require("speaker");
const TalkiePi = require("./lib/TalkiePi");
// const SPI = require("./lib/SPI");
const Button = require("./lib/Button");
const LED = require("./lib/LED");
const options = require("./options");
const interval = 500;

function say(phrase) {
  let lame = require("lame");
  let tts = require("simple-tts");
  let encoder = new lame.Decoder();
  encoder.pipe(new Speaker());
  tts(phrase, {format:"mp3", stream:encoder});
}

// attempt to connect to mumble
mumble.connect( options.server || "localhost", (err, client) => {
  if (err) throw new Error( err );

  // cleanup on exit
  process.on("SIGUSR2", () => {
    client.disconnect();
  });
  process.on("SIGINT", () => {
    client.disconnect();
  });

  client.authenticate(options.username, options.password);
  client.on("initialized", start.bind(null, client));
});

function start(client) {

  const talkiePi = new TalkiePi({client: client});
  let micInstance;

  // talkiePi.on("down", micInstance.resume.bind(micInstance));
  talkiePi.on("down", () => {
    micInstance = mic({ "rate": "44100", "channels": "1", "debug": false });
    const micInputStream = micInstance.getAudioStream();

    // send any mic input to mumble
    micInputStream.pipe(client.inputStream({
      channels: 1,
      sampleRate: 44100,
    }));

    micInputStream.on("startComplete", talkiePi.transmitStart.bind(talkiePi));
    micInputStream.on("stopComplete", talkiePi.transmitStop.bind(talkiePi));

    // start recording
    micInstance.start();
  });
  talkiePi.on("up", e => {
    if (micInstance) micInstance.pause.bind(micInstance);
  });

  // talkiePi.spiChannel.on("change", value => {

  //   // how many values constitute a single LED
  //   const width = Math.ceil(1024 / talkiePi.ledChannels.length);
  //   // which LED is current selected
  //   const led = Math.floor(value / width);

  //   // turn off all of the channel LEDs
  //   _.invoke(talkiePi.ledChannels, "off");
  //   // turn the selected LED on
  //   talkiePi.ledChannels[led].on();
  // });

  // create a speaker to send audio to
  const speaker = new Speaker({
    channels: 1,
    bitDepth: 16,
    sampleRate: 44100,
  });
  speaker.on("error", h.log.bind(h, "speaker error:"));
  // pipe mumble audio directly to the speaker
  client.outputStream().pipe( speaker );

  say("Ready!");
}
