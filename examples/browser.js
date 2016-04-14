var AmpViewer = require('amplitude-viewer')
var CBuffer = require('CBuffer')
var getUserMedia = require('getusermedia')
var pull = require('pull-stream')

var readAudio = require('../')

var ascope = AmpViewer({
  slider: {
    min: -1, max: 2,
    init: -1
  }
})
ascope.appendTo(document.body)

// otherwise return microphone input
getUserMedia({
  video: false,
  audio: true
}, function(err, source) {
  if (err) { throw err }

  var cbuf = CBuffer(1024 * 10)

  pull(
    readAudio({
      source: source,
      buffer: 1024
    }),
    pull.map(function (audio) {
      console.log('audio', audio)
      for (var i = 0; i < audio.shape[0]; i++) {
        cbuf.push(audio.get(i, 0))
      }
      ascope.draw(function (t) {
        return cbuf.get(Math.floor(t * 1024))
      })
    }),
    pull.drain()
  )
})
