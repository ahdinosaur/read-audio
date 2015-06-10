# read-audio 

#### stability: experimental

read audio as a stream of typed arrays.

currently uses SoX.

## install

with [npm](https://npmjs.org), do:

```
npm i --save read-audio
```

## usage

```
var readAudio = require('read-audio')

var audio = readAudio({
  soxPath: 'sox',
  inFile: '-d', // '-d' is default device
  bits: 16, // 8 16 32 supported
  channels: 1,
  encoding: 'unsigned-integer',
    // 'signed-integer' also supported
  endian: 'little'
    // 'big' also supported
})

audio.stderr.pipe(process.stderr)
audio.pipe(require('stdout')())
```

## license

ISC
