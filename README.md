# read-audio 

read audio samples as a stream of [ndsamples](https://npmjs.org/ndsamples)

[![unstable](http://badges.github.io/stability-badges/dist/unstable.svg)](http://github.com/badges/stability-badges)

## install

with [npm](https://npmjs.org), do:

```
npm i --save read-audio
```

### using SoX

using `read-audio` with `node` depends on having [SoX](http://sox.sourceforge.net/) installed:

- on Mac OS X, do `brew install sox`
- on Debian-based Linux distros (e.g. Ubuntu), do `sudo apt-get install sox`

## example

```
var readAudio = require('read-audio')
var through = require('through2')
var terminalBar = require('terminal-bar')

var audio = readAudio()
.pipe(through.obj(function (arr, enc, cb) {
  var data = [].slice.call(arr.data).slice(0, 128)
  cb(null, terminalBar(data) + "\n")
}))
.pipe(process.stdout)
```

(To run this example you will need:)

```
npm install --save through2
npm install --save terminal-bar
```

## api

### using `node`

```
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
```

### using `browserify`

`npm install --save getusermedia`

```
getUserMedia({
  video: false,
  audio: true
}, function (err, media) {
  if (err) { throw err }

  var audio = readAudio({
    source: media,
    buffer: 1024,
    channels: 2,
})
```

`source` can be either MediaStream[0] or AudioNode[1]

[0](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_API#LocalMediaStream)
[1](https://developer.mozilla.org/en-US/docs/Web/API/AudioNode)

## license

ISC
