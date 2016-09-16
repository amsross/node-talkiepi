"use strict";
process.setMaxListeners(0);

const stream = require("stream");
const _ = require("lodash");
const h = require("highland");
const mumble = require("mumble");
const mic = require("mic");
const Speaker = require("speaker");
const SPI = require("./lib/SPI");
const Button = require("./lib/Button");
const LED = require("./lib/LED");
const options = require("./options");
const interval = 500;

function say(phrase) {
  let lame = require("lame");
  let tts = require("simple-tts");
  let encoder = new lame.Decoder();
  let speaker = new Speaker();
  encoder.pipe(speaker);
  tts(phrase, {format:"mp3", stream:encoder});
}

const buttonSPST = new Button({
  pin: 7,
  interval: interval,
});
const ledTransmit = new LED(2);
const ledReceive = new LED(3);

const micInstance = mic({ "rate": "44100", "channels": "1", "debug": false });
const micInputStream = micInstance.getAudioStream();

// Is the mic recording?
//  true = yes
//  false = no
var micInstanceStatus;

micInputStream.on("startComplete", () => {
  h.log("starting capture");
  micInstanceStatus = true;
  ledTransmit.on();
});
micInputStream.on("stopComplete", () => {
  h.log("stopping capture");
  micInstanceStatus = false;
  ledTransmit.off();
});
micInputStream.on("resumeComplete", () => {
  h.log("resuming capture");
  micInstanceStatus = true;
  ledTransmit.on();
});
micInputStream.on("pauseComplete", () => {
  h.log("pausing capture");
  micInstanceStatus = false;
  ledTransmit.off();
});

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

  client.on("voice-start", ledReceive.on.bind(ledReceive));
  client.on("voice-end", ledReceive.off.bind(ledReceive));

  buttonSPST.on("down", micInstance.resume.bind(micInstance));
  buttonSPST.on("up", micInstance.pause.bind(micInstance));

  const spiChannel = new SPI({
    channel: 0,
    interval: interval,
  });

  spiChannel.on("change", value => {
    h.log("change %s", value);

    const width = Math.ceil(1024 / ledChannels.length);
    const led = Math.floor(value / width);

    _.each(ledChannels, ledChannel => {
      ledChannel.off();
    });
    ledChannels[led].on();
  });

  const speaker = new Speaker({
    channels: 1,
    bitDepth: 16,
    sampleRate: 44100,
  });
  speaker.on("error", h.log.bind(h, "error"));
  client.outputStream().pipe( speaker );

  // the mumble client to send audio to
  const input = client.inputStream({
    channels: 1,
    sampleRate: 44100,
  });

  // send any mic input to mumble
  micInputStream.pipe(input);

  // start recording
  micInstance.start();
  // paue recording
  micInstance.pause();

  say("Ready!");
}
