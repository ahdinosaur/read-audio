var audioReadStream = require('./')
var through = require('through2')
var terminalBar = require('terminal-bar')

var audio = audioReadStream({
  buffer: 1024
})

audio
.pipe(through.obj(function (arr, enc, cb) {
  var data = [].slice.call(arr.data).slice(0, 128)
  cb(null, terminalBar(data) + "\n")
}))
.pipe(process.stdout)
