const nopt = require("nopt");
const knownOpts = {
  "server" : [String, null],
  "username" : [String, null],
  "password" : [String, null],
}
const shortHands = {
  "s" : ["--server"],
  "u" : ["--username"],
  "p" : ["--password"],
}

module.exports = nopt(knownOpts, shortHands, process.argv, 2);
