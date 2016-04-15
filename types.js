var Tc = require('tcomb')
var isPOT = require('is-power-of-two')
var defaults = require('tcomb-defaults')

var PowerOfTwo = Tc.refinement(
  Tc.Number, isPOT, 'PowerOfTwo'
)

var MediaStream = Tc.irreducible(
  'MediaStream',
  function isMediaStream (obj) {
    return obj && obj.toString() === '[object MediaStream]'
  }
)

var AudioNode = Tc.irreducible(
  'AudioNode',
  function isAudioNode (obj) {
    return obj instanceof AudioNode
  }
)

var AudioContext = Tc.irreducible(
  'AudioContext',
  function isAudioContext (obj) {
    return obj instanceof window.AudioContext ||
      obj instanceof window.webkitAudioContext
  }
)

var Options = Tc.struct({
  buffer: Tc.maybe(PowerOfTwo),
  channels: Tc.maybe(Tc.Number),
})

var BrowserOptions = defaults(Options.extend({
  source: Tc.union([MediaStream, AudioNode], 'Source'),
  context: Tc.maybe(AudioContext),
}), {
  buffer: 1024,
  channels: 1,
  context: function () {
    var AudioContext = window.AudioContext || window.webkitAudioContext
    return new AudioContext
  }
})

var NodeOptions = defaults(Options.extend({
  inFile: Tc.maybe(Tc.String),
  rate: Tc.maybe(Tc.Number),
  dtype: Tc.maybe(Tc.enums.of([
    'int8', 'uint8', 'int16', 'uint16',
    'int32', 'uint32', 'float32', 'float64'
  ])),
  soxPath: Tc.maybe(Tc.String),
}), {
  buffer: 1024,
  channels: 1,
  soxPath: 'sox',
  inFile: '-d',
  dtype: 'int32',
  rate: 48000,
})

// https://github.com/dominictarr/is-pull-stream/blob/master/index.js
var PullStreamSource = Tc.refinement(
  Tc.Function,
  function (s) { return s.length === 2 },
  'PullStreamSource'
)

module.exports = {
  MediaStream,
  BrowserOptions,
  NodeOptions,
  PullStreamSource
}
