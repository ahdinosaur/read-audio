var through = require('through2')
var AmpViewer = require('amplitude-viewer')
var CBuffer = require('CBuffer')
var getUserMedia = require('getusermedia')

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

  var stream = readAudio({
    source: source,
    buffer: 1024
  })
  
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
