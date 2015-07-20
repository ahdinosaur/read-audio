var audioReadStream = require('../')
var through = require('through2')
var terminalBar = require('terminal-bar')

audioReadStream()
.pipe(through.obj(function (arr, enc, cb) {
  var data = [].slice.call(arr.data).slice(0, 128)
  cb(null, terminalBar(data) + "\n")
}))
.pipe(process.stdout)
