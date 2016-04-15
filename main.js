'use strict';

var spawn = require('child_process').spawn
var Ndsamples = require('ndsamples')
var getDataType = require('dtype')
var bufferToTypedArray = require('buffer-to-typed-array')
var rangeFit = require('range-fit')
var intmin = require('compute-intmin')
var intmax = require('compute-intmax')
var pull = require('pull-stream')
var toPull = require('stream-to-pull-stream')
var Tc = require('tcomb')

var types = require('./types')

module.exports = Tc.func(
  [types.NodeOptions, Tc.Function], types.PullStreamSource
).of(readAudio)

function readAudio (opts, onAbort) {
  console.log('opts', opts, 'onAbort', onAbort)
  // get derived opts
  opts = deriveOpts(opts)
  
  // run sox process
  var ps = spawn(
    opts.soxPath,
    [
      '--buffer', opts.buffer,
      '--bits', opts.bits,
      '--channels', opts.channels,
      '--encoding', opts.encoding,
      '--rate', opts.rate,
      opts.inFile,
      '-p'
    ]
  )

  // get audio
  var audio = pull(
    toPull(ps.stdout),
    pull.map(parseRawAudio(opts)),
    pull.map(normalize(opts))
  )

  // stash stderr on the audio stream
  audio.stderr = toPull(ps.stderr)

  // stash process on the audio stream
  audio.ps = ps
  
  return audio
}

function parseRawAudio (opts) {
  var toTypedArray = bufferToTypedArray(opts.dtype)

  return function (buf) {
    var arr = toTypedArray(buf)
    return {
      data: arr,
      shape: [arr.length / opts.channels, opts.channels],
      format: {
        sampleRate: opts.rate
      }
    }
  }
}

function deriveOpts (opts) {
  var patch = {
    encoding: { $set: getEncoding(opts.dtype) },
    bits: { $set: getBits(opts.dtype) },
  }
  return types.NodeOptions.update(opts, patch)
}

function getEncoding (dtype) {
  switch (dtype[0]) {
    case 'u':
      return 'unsigned-integer'
    case 'i':
      return 'signed-integer'
    case 'f':
      return 'floating-point'
  }
}

function getBits (dtype) {
  return getDataType(dtype).BYTES_PER_ELEMENT * 8
}

function normalize (opts) {
  return function (audioIn) {
    // not necessary to normalize floats
    // TODO: double check this on a system that supports floats from SoX
    if (opts.dtype[0] === 'f') {
      return Ndsamples(audioIn)
    }

    var minVal = intmin(opts.dtype)
    var maxVal = intmax(opts.dtype)

    var audioOut = Ndsamples({
      data: new Float32Array(audioIn.data.length),
      shape: audioIn.shape,
      format: audioIn.format
    })

    for (var i = 0; i < audioOut.data.length; i++) {
      audioOut.data[i] = rangeFit(audioIn.data[i], minVal, maxVal, -1.0, 1.0)
    }

    return audioOut
  }
}

function defined (a, b) {
  return Tc.Nil.is(a) ? b : a
}
