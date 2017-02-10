'use strict';

var fs = require('fs')
var spawn = require('child_process').spawn
var defined = require('defined')
var Ndsamples = require('ndsamples')
var getDataType = require('dtype')
var bufferToTypedArray = require('buffer-to-typed-array')
var rangeFit = require('range-fit')
var intmin = require('compute-intmin')
var intmax = require('compute-intmax')
var pull = require('pull-stream')
var toPull = require('stream-to-pull-stream')

module.exports = readAudio

function readAudio (opts, onAbort) {
  var ps;
  opts = defaultOpts(opts)

  // get derived opts
  opts = deriveOpts(opts)

  if (fs.existsSync(opts.arecordPath)) {
      ps = spawn(
        opts.arecordPath,
        [ 
          '-D', 'hw:0,0',
          '-f', 'dat',
          '--buffer-size', opts.buffer
        ]
      );
  } else {
      ps = spawn(
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
  }


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

function defaultOpts (opts) {
  opts = defined(opts, {})
  opts.soxPath = defined(opts.soxPath, 'sox')
  opts.arecordPath = defined(opts.arecordPath, 'arecord')
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
  return function (audioIn, enc, cb) {
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

    return audioOut
  }
}
