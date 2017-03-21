/* global describe */

describe('node-talkiepi', function () {
  global.assert = require('assert');
  global.proxyquire = require('proxyquire');
  global.sinon = require('sinon');
  global.r = require('ramda');
  global.mumble = {
    'authenticate': sinon.spy((username, password) => true),
    'connect': sinon.spy((server, cb) => cb(null, mumble)),
    'on': sinon.spy((event, callback) => true),
  };

  beforeEach(function () {
    mumble.authenticate.reset();
    mumble.connect.reset();
    mumble.on.reset();
  });

  describe('index.js', function () {

    it('should attempt to connect to mumble', function() {
      const index = proxyquire('../', {
        './options': {
          'server': '1.0.0.1',
          'username': 'uname',
          'password': 'pword',
        },
        'mumble': r.merge(mumble, {'@noCallThru': true}),
        'speaker': r.merge({
        }, {'@noCallThru': true}),
        './lib/TalkiePi': r.merge({
        }, {'@noCallThru': true}),
      });

      sinon.assert.calledOnce(mumble.connect);
      sinon.assert.calledWith(mumble.connect, '1.0.0.1');

      sinon.assert.calledOnce(mumble.authenticate);
      sinon.assert.calledWith(mumble.authenticate, 'uname', 'pword');

      sinon.assert.calledOnce(mumble.on);
      sinon.assert.calledWith(mumble.on, 'initialized');
    });
  });
});
