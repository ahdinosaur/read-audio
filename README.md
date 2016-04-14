# read-audio 

read audio samples as a [source pull stream](https://github.com/dominictarr/pull-stream) of [ndsamples](https://npmjs.org/ndsamples)

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
var pull = require('pull-stream')
var terminalBar = require('terminal-bar')

pull(
  readAudio(),
  pull.map(function (arr, enc, cb) {
    var data = [].slice.call(arr.data, 0, 128)
    return terminalBar(data) + "\n"
  }),
  pull.drain(function (str) {
    process.stdout.write(str)
  })
)
```

(To run this example you will need:)

```
npm install --save pull-stream
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

The Apache License

Copyright &copy; 2016 Michael Williams

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
