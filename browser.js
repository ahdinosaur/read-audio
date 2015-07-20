var getUserMedia = require('getusermedia')
var through = require('through2')
var defined = require('defined')
var Ndsamples = require('ndsamples')

module.exports = readAudio
 
function readAudio (opts, cb) {
  opts = defined(opts, {})

  // get opts
  var channels = defined(opts.channels, 1)
  var buffer = defined(opts.buffer, 1024)
  var highWaterMark = defined(opts.highWaterMark, 1)
  var context = opts.context
  if (context == null) {
    var AudioContext = window.AudioContext || window.webkitAudioContext
    context = new AudioContext
  }
  var input = opts.input

  createMicStream(cb)

  function createMicStream (cb) {
    getAudioInput(function(err, input) {
      if (err) { return cb(err) }

      var stream = audioInputToStream(input)

      cb(null, stream)
    })
  }

  function getAudioInput (cb) {
    // if input given, use it
    if (input) {
      return cb(null, input)
    }

    // otherwise return microphone input
    getUserMedia({
      video: false,
      audio: true
    }, function(err, micStream) {
      if (err) { return cb(err) }

      input = context.createMediaStreamSource(micStream)

      cb(null, input)
    })
  }

  function audioInputToStream (input) {
    var stream = through.obj({
      highWaterMark: highWaterMark
    })

    var recorder = context.createScriptProcessor(buffer, channels, channels);

    recorder.onaudioprocess = processInput(stream)

    input.connect(recorder)
    recorder.connect(context.destination)

    // save reference to Web Audio nodes, which
    // prevents audio processing from being GC'd
    stream._input = input
    stream._recorder = recorder

    return stream
  }

  function processInput (stream) {
    return function onAudioProcess (e) {
      var audioIn = e.inputBuffer
      var numChannels = audioIn.numberOfChannels
      var numSamplesPerChannel = audioIn.length

      var samples = Ndsamples({
        data: new Float32Array(numSamplesPerChannel * numChannels),
        shape: [numSamplesPerChannel, numChannels],
        format: {
          sampleRate: context.sampleRate
        }
      })

      for (var ci = 0; ci < numChannels; ci++) {
        var channel = audioIn.getChannelData(ci)
        for (var bi = 0; bi < numSamplesPerChannel; bi++) {
          var sample = channel[bi]
          samples.set(bi, ci, sample)
        }
      }

      stream.write(samples)
    }
  }
}
