var through = require('through2')
var AmpViewer = require('amplitude-viewer')
var CBuffer = require('CBuffer')

var readAudio = require('../')

var ascope = AmpViewer({
  slider: {
    min: -1, max: 2,
    init: -1
  }
})
ascope.appendTo(document.body)

readAudio({
  buffer: 1024
}, function (err, stream) {
  if (err) { throw err }
  var cbuf = CBuffer(1024 * 10)

  stream
  .on('data', function (audio) {
    for (var i = 0; i < audio.shape[0]; i++) {
      cbuf.push(audio.get(i, 0))
    }
    ascope.draw(function (t) {
      return cbuf.get(Math.floor(t * 1024))
    })
  })
})
