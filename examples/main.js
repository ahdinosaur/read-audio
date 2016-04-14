var audioReadStream = require('../')
var terminalBar = require('terminal-bar')
var pull = require('pull-stream')

pull(
  audioReadStream(),
  pull.map(function (audio) {
    var data = [].slice.call(audio.data, 0, 128)
    return terminalBar(data) + "\n"
  }),
  pull.drain(function (str) {
    process.stdout.write(str)
  })
)
