'use strict';

var spawn = require('child_process').spawn
var through = require('through2')
var defined = require('defined')
var Ndsamples = require('ndsamples')
var getDataType = require('dtype')
var bufferToTypedArray = require('buffer-to-typed-array')
var rangeFit = require('range-fit')
var intmin = require('compute-intmin')
var intmax = require('compute-intmax')

module.exports = audioReadStream

function audioReadStream (opts) {
  opts = defaultOpts(opts)

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
  var audio = ps.stdout
    .pipe(parseRawAudio(opts))
    .pipe(normalize(opts))
    .pipe(through.obj({
      highWaterMark: opts.highWaterMark
    }))

  // stash stderr on the audio stream
  audio.stderr = ps.stderr
    .pipe(through.obj())

  // stash process on the audio stream
  audio.ps = ps
  
  return audio
}

function parseRawAudio (opts) {
  var toTypedArray = bufferToTypedArray(opts.dtype)

  return through.obj({
    highWaterMark: opts.highWaterMark
  }, function (buf, enc, cb) {
    var arr = toTypedArray(buf)
    var audio = {
      data: arr,
      shape: [arr.length / opts.channels, opts.channels],
      format: {
        sampleRate: opts.rate
      }
    }
    cb(null, audio)
  })
}

function defaultOpts (opts) {
  opts = defined(opts, {})
  opts.soxPath = defined(opts.soxPath, 'sox')
  opts.inFile = defined(opts.inFile, '-d')
  opts.dtype = defined(opts.dtype, 'int32')
  opts.channels = defined(opts.channels, 1)
  opts.rate = defined(opts.rate, 48000)
  opts.buffer = defined(opts.buffer, 1024)
  opts.highWaterMark = defined(opts.highWaterMark, 1)
  return opts
}

function deriveOpts (opts) {
  opts.encoding = getEncoding(opts.dtype)
  opts.bits = getBits(opts.dtype)
  return opts
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
  return through.obj({
    highWaterMark: opts.highWaterMark
  }, function (audioIn, enc, cb) {
    // not necessary to normalize floats
    // TODO: double check this on a system that supports floats from SoX
    if (opts.dtype[0] === 'f') {
      return cb(null, Ndsamples(audioIn))
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

    cb(null, audioOut)
  })
}
