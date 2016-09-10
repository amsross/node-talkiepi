"use strict";

const stream = require("stream");
const _ = require("lodash");
const h = require("highland");
const mumble = require("mumble");
const mic = require("mic");
const Speaker = require("speaker");
const raspi = require("raspi-io");
const five = require("johnny-five");
const board = new five.Board({
    io: new raspi()
});
const ledTransmit = {};
const ledReceive = {};

const micInstance = mic({ "rate": "44100", "channels": "1", "debug": false });
const micInputStream = micInstance.getAudioStream();

// Is the mic recording?
//  true = yes
//  false = no
var micInstanceStatus;

micInputStream.on("startComplete", () => {
  h.log("starting capture");
  micInstanceStatus = true;
  ledTransmit.writeSync(1);
});
micInputStream.on("stopComplete", () => {
  h.log("stopping capture");
  micInstanceStatus = false;
  ledTransmit.writeSync(0);
});
micInputStream.on("resumeComplete", () => {
  h.log("resuming capture");
  micInstanceStatus = true;
  ledTransmit.writeSync(1);
});
micInputStream.on("pauseComplete", () => {
  h.log("pausing capture");
  micInstanceStatus = false;
  ledTransmit.writeSync(0);
});

// attempt to connect to mumble
mumble.connect( process.env.MUMBLE_URL || "localhost", (err, client) => {
  if (err) throw new Error( err );

  client.authenticate("mp3-" + (Date.now() % 10));
  client.on( "initialized", () => {
    start( client );
  });
});

function start(client) {

  client.on("voice-start", voice => {
    h.log(voice);
    ledReceive.writeSync(1);
  });

  client.on("voice-end", voice => {
    h.log(voice);
    ledReceive.writeSync(0);
  });

  var voices = {};

  let speaker = new Speaker({
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
}


process.on("SIGUSR2", function () {
  ledReceive.unexport();
  ledTransmit.unexport();
});
process.on("SIGINT", function () {
  ledReceive.unexport();
  ledTransmit.unexport();
});
