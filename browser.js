var through = require('through2')
var defined = require('defined')
var Ndsamples = require('ndsamples')

module.exports = readAudio
 
function readAudio (opts) {
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
  var source = opts.source

  if (isMediaStream(source)) {
    source = getAudioSourceFromMediaStream(source)
  }

  return audioSourceToStream(source)

  function getAudioSourceFromMediaStream (mediaStream) {
    return context.createMediaStreamSource(mediaStream)
  }

  function audioSourceToStream (source) {
    var stream = through.obj({
      highWaterMark: highWaterMark
    })

    var processor = context.createScriptProcessor(buffer, channels, channels)

    processor.onaudioprocess = processInput(stream)

    source.connect(processor)
    processor.connect(context.destination)

    // save reference to Web Audio nodes, which
    // prevents audio processing from being GC'd
    stream.__source = source
    stream.__processor = processor

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

function isMediaStream (obj) {
  return obj && obj.toString() === '[object MediaStream]'
}
