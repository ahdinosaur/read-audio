# read-audio 

use SoX to read audio samples as a stream of typed ndarrays of floats between -1.0 and 1.0.

**stability: unstable.**

## install

with [npm](https://npmjs.org), do:

```
npm i --save read-audio
```

## usage

```
var readAudio = require('read-audio')
var through = require('through2')
var show = require('ndarray-show')

var audio = readAudio({
  soxPath: 'sox',
  inFile: '-d', // '-d' is default device
  channels: 2,
  rate: 48000,
  dtype: 'int32',
    // int8, uint8, int16, uint16,
    // int32, uint32, float32, float64
    // also supported
})

audio.stderr.pipe(process.stderr)
audio
.pipe(through.obj(function (arr, enc, cb) {
  cb(null, show(arr))
}))
.pipe(process.stdout)
```

## license

ISC
