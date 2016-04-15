var readAudio = require('../')
var terminalBar = require('terminal-bar')
var pull = require('pull-stream')

pull(
  readAudio({}, function onAbort () {
    console.log('audio failed!')
  }),
  pull.map(function (audio) {
    var data = [].slice.call(audio.data, 0, 128)
    return terminalBar(data) + "\n"
  }),
  pull.drain(function (str) {
    process.stdout.write(str)
  })
)
