const _ = require("lodash");
const h = require("highland");
const mumble = require("mumble");
const mic = require("mic");
const micInstance = mic({ "rate": "16000", "channels": "1", "debug": false, "exitOnSilence": 6 });
const micInputStream = micInstance.getAudioStream();

// Is the mic recording?
//  true = yes
//  false = no
var micInstanceStatus;

// attempt to connect to mumble
mumble.connect( process.env.MUMBLE_URL, (err, client) => {
  if (err) throw new Error( error );

  client.authenticate("mp3-" + (Date.now() % 10));
  client.on( "initialized", () => {
    start( client );
  });
});

// log some events
micInputStream.on("startComplete", h.log.bind(h,"start"))
micInputStream.on("stopComplete", h.log.bind(h,"stop"))
micInputStream.on("pauseComplete", h.log.bind(h,"pause"))
micInputStream.on("resumeComplete", h.log.bind(h,"resume"))
micInputStream.on("error", h.log.bind(h,"error"))

function start(client) {

  // the mumble client to send audio to
  const input = client.inputStream({
    channels: 1,
    sampleRate: 16000,
    gain: 0.25
  });

  // start and then pause recording
  micInstance.start();
  micInstance.pause();

  // send any mic input to mumble
  micInputStream.pipe(input);
}

// if a key is pressed, turn the mic on or off
return h(process.stdin)
  .each( line => {
    if (!micInstanceStatus) {
      h.log("starting capture");
      micInstance.resume();
    }
    if (micInstanceStatus) {
      h.log("stopping capture");
      micInstance.pause();
    }
    micInstanceStatus = !micInstanceStatus;
  })
