# read-audio 

use SoX to read audio samples as a stream of typed ndarrays of floats between -1.0 and 1.0.

[![unstable](http://badges.github.io/stability-badges/dist/unstable.svg)](http://github.com/badges/stability-badges)

## install

with [npm](https://npmjs.org), do:

```
npm i --save read-audio
```

## usage

```

var readAudio = require('read-audio')
var through = require('through2')
var terminalBar = require('terminal-bar')

var audio = readAudio({
  buffer: 1024,
  inFile: '-d', // '-d' is default device
  channels: 2,
  rate: 44000,
  dtype: 'int32',
    // int8, uint8, int16, uint16,
    // int32, uint32, float32, float64
    // also supported
  soxPath: 'sox'
})

audio.stderr.pipe(process.stderr)

audio
.pipe(through.obj(function (arr, enc, cb) {
  var data = [].slice.call(arr.data).slice(0, 128)
  cb(null, terminalBar(data) + "\n")
}))
.pipe(process.stdout)
```

(To run this example you will need:)

```
brew install sox
npm i --save through2
npm i --save terminal-bar
```

## license

ISC
