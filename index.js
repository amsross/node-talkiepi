'use strict';
const mumble = require('mumble');
const Speaker = require('speaker');
const TalkiePi = require('./lib/TalkiePi');
const options = require('./options');

function say (phrase) {
  console.log(`talkiepi: say: ${phrase}`);
}

// attempt to connect to mumble
mumble.connect(options.server || 'localhost', (err, client) => {
  if (err) throw new Error(err);

  client.authenticate(options.username, options.password);
  client.on('initialized', start.bind(null, client));
});

function start (client) {
  const talkiePi = new TalkiePi({client: client});
  talkiePi.on('say', say);

  // create a speaker to send audio to
  const speaker = new Speaker({
    'bitDepth': 16,
    'channels': 1,
    'sampleRate': 44100,
  });
  speaker.on('error', err => say(`speaker error: ${err}`));
  // pipe mumble audio directly to the speaker
  client.outputStream().pipe(speaker);

  say('Ready!');
}
