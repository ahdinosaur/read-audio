var pull = require('pull-stream')
var Pushable = require('pull-pushable')
var defined = require('defined')
var Ndsamples = require('ndsamples')

module.exports = readAudio
 
function readAudio (opts, onAbort) {
  opts = defined(opts, {})

  // get opts
  var channels = defined(opts.channels, 1)
  var buffer = defined(opts.buffer, 1024)
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
    var pushable = Pushable(onAbort)

    var processor = context.createScriptProcessor(buffer, channels, channels)

    processor.onaudioprocess = processInput(pushable)

    source.connect(processor)
    processor.connect(context.destination)

    // save reference to Web Audio nodes, which
    // prevents audio processing from being GC'd
    pushable.__source = source
    pushable.__processor = processor

    return pushable
  }

  function processInput (pushable) {
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

      pushable.push(samples)
    }
  }
}

function isMediaStream (obj) {
  return obj && !!MediaStream && obj instanceof MediaStream
}
