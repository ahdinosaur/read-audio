'use strict';

var spawn = require('child_process').spawn
var through = require('through2')
var defined = require('defined')
var repeat = require('repeat-array')
var typedArrayTypes = require('enum-buffer-array-types')

function defaultOpts (opts) {
  opts = defined(opts, {})
  opts.soxPath = defined(opts.soxPath, 'sox')
  opts.inFile = defined(opts.inFile, '-d')
  opts.bits = defined(opts.bits, 2 * 8)
  opts.channels = defined(opts.channels, 1)
  opts.rate = defined(opts.rate, 48000)
  opts.encoding = defined(opts.encoding, 'signed-integer')
  opts.endian = defined(opts.endian, 'little')
  return opts
}

function audioReadStream (opts) {
  opts = defaultOpts(opts)
  
  // run sox process
  var ps = spawn(
    opts.soxPath,
    [
      opts.inFile,
      '--bits', opts.bits,
      '--channels', opts.channels,
      '--encoding', opts.encoding,
      '--endian', opts.endian,
      '--rate', opts.rate,
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

  var byteRate = opts.bits / 8
  var numChannels = opts.channels

  function getNumSamples (buf) {
    return buf.length /
      (byteRate * numChannels)
  }

  var bufferReadId = getBufferReadId(opts)
  var TypedArray = getTypedArray(opts)

  return through.obj(function (buf, enc, cb) {
    var numSamples = getNumSamples(buf)
    var bufferRead = buf[bufferReadId].bind(buf)

    var channelSamples = repeat(function () {
      return new TypedArray(numSamples)
    }, numChannels)

    var sampleIndex, channelIndex, offset
    for (sampleIndex = 0; sampleIndex < numSamples; sampleIndex++) {
      for (channelIndex = 0; channelIndex < numChannels; channelIndex++) {
        offset = sampleIndex + channelIndex
        channelSamples[channelIndex][sampleIndex] = bufferRead(offset, byteRate)
      }
    }

    cb(null, channelSamples)
  })
}

if (!module.parent) {
  var stdout = require('stdout')

  var audio = audioReadStream()

  audio.stderr.pipe(process.stderr)
  audio.pipe(stdout())
}

function getTypedArray (opts) {
  var typedArrayId = getTypedArrayId(opts)

  return typedArrayTypes.getConstructor(
    typedArrayTypes[typedArrayId]
  )
}

function getTypedArrayId (opts) {
  return '' + toEncoding(opts.encoding) + toBits(opts.bits) + 'Array'

  function toBits (bits) {
    switch (bits) {
      case 8: case 16: case 32:
        return String(bits)
      default:
        throw new Error('bits not implemented: ' + bits)
    }
  }

  function toEncoding (encoding) {
    switch (encoding) {
      case 'signed-integer':
        return 'Int'
      case 'unsigned-integer':
        return 'Uint'
      default:
        throw new Error("typed array encoding not implemented: " + encoding)
    }
  }
}

function getBufferReadId (opts) {
  return 'read' + toEncoding(opts.encoding) + toEndian(opts.endian)

  function toEndian (endian) {
    if (endian !== 'little' && endian !== 'big') {
      throw new Error('incorrect endian: ' + endian)
    }

    return (endian === 'little') ? 'LE' : 'BE'
  }

  function toEncoding (encoding) {
    switch (encoding) {
      case 'signed-integer':
        return 'Int'
      case 'unsigned-integer':
        return 'UInt'
      default:
        throw new Error("buffer encoding not implemented: " + encoding)
    }
  }
}
