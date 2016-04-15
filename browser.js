var pull = require('pull-stream')
var Pushable = require('pull-pushable')
var Ndsamples = require('ndsamples')
var Tc = require('tcomb')

var types = require('./types')

module.exports = Tc.func(
  types.BrowserOptions, types.PullStreamSource
).of(readAudio)
 
function readAudio (opts, onAbort) {
  // derive opts
  if (types.MediaStream.is(source)) {
    opts = types.BrowserOptions.update(opts, {
      source: { $set: getAudioSourceFromMediaStream(source) }
    })
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
