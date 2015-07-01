var audioReadStream = require('./')
var through = require('through2')

if (!module.parent) {
  var show = require('ndarray-show')

  var audio = audioReadStream()

  audio.stderr.pipe(process.stderr)
  audio
  .pipe(through.obj(function (arr, enc, cb) {
    cb(null, show(arr))
  }))
  .pipe(process.stdout)
}
