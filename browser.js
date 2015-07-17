var getUserMedia = require('getusermedia')
var through = require('through2')
var defined = require('defined')
var micStream = require('microphone-stream')
var Ndarray = require('ndarray')

module.exports = readAudio
 
function readAudio (opts, cb) {
  opts = defaultOpts(opts)

  createMicStream(opts, cb)
}

function defaultOpts (opts) {
  opts = defined(opts, {})
  opts.channels = defined(opts.channels, 1)
  opts.buffer = defined(opts.buffer, 1024)
  return opts
}

function createMicStream (opts, cb) {
  getUserMedia({
    video: false,
    audio: true
  }, function(err, stream) {

    if (err) { return cb(err) }

    var mic = micStream(stream, {
      bufferSize: opts.buffer,
      channels: opts.channels
    })
    .pipe(micToSamples(opts))
    
    cb(null, mic)
  })
}

function micToSamples (opts) {
  return through.obj(function(channels, enc, cb) {
    var samples = Ndarray(
      new Float32Array(opts.buffer * opts.channels),
      [opts.buffer, opts.channels]
    )

    for (var bi = 0; bi < opts.buffer; bi++) {
      for (var ci = 0; ci < opts.channels; ci++) {
        samples.set(bi * opts.channels, ci, channels[ci][bi])
      }
    }

    cb(null, samples)
  })
}
