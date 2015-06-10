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

var audio = readAudio()

audio.stderr.pipe(process.stderr)
audio.pipe(require('stdout')())
```

## license

ISC
