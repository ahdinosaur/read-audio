# read-audio 

#### stability: experimental

read audio as a stream of typed ndarrays.

currently uses SoX.

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
  channels: 1,
  rate: 48000,
  dtype: 'int16',
    // int8, uint8, int16, uint16,
    // int32, uint32, float32, float64
    // also supported
  endian: 'little'
    // 'big' also supported
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
