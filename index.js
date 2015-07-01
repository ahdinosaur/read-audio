'use strict';

var spawn = require('child_process').spawn
var through = require('through2')
var defined = require('defined')
var Ndarray = require('ndarray')
var getDataType = require('dtype')
var bufferToTypedArray = require('buffer-to-typed-array')

module.exports = audioReadStream

function audioReadStream (opts) {
  opts = defaultOpts(opts)

  // get derived opts
  opts = deriveOpts(opts)
  
  // run sox process
  var ps = spawn(
    opts.soxPath,
    [
      '--bits', opts.bits,
      '--channels', opts.channels,
      '--encoding', opts.encoding,
      '--endian', opts.endian,
      '--rate', opts.rate,
      opts.inFile,
      '-p'
    ]
  )

  // get audio
  var audio = ps.stdout
    .pipe(parseRawAudio(opts))
    .pipe(through.obj())

  // stash stderr on the audio stream
  audio.stderr = ps.stderr
    .pipe(through.obj())
  // stash process on the audio stream
  audio.ps = ps
  
  return audio
}
    
function parseRawAudio (opts) {
  var toTypedArray = bufferToTypedArray({
    dtype: opts.dtype,
    endian: opts.endian
  })

  return through.obj(function (buf, enc, cb) {
    var arr = toTypedArray(buf)
    var ndarr = Ndarray(
      arr,
      [opts.channels, arr.length / opts.channels]
    )

    cb(null, ndarr)
  })
}

function defaultOpts (opts) {
  opts = defined(opts, {})
  opts.soxPath = defined(opts.soxPath, 'sox')
  opts.inFile = defined(opts.inFile, '-d')
  opts.dtype = defined(opts.dtype, 'int16')
  opts.channels = defined(opts.channels, 1)
  opts.rate = defined(opts.rate, 48000)
  opts.endian = defined(opts.endian, 'little')
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
