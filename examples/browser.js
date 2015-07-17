var through = require('through2')

var readAudio = require('../')

var canvas = document.createElement('canvas')
document.body.appendChild(canvas)

var style = document.createElement('link')
style.setAttribute('rel', 'stylesheet')
style.setAttribute('type', 'text/css')
style.href = './examples/browser.css'
document.head.appendChild(style)

readAudio({

}, function (err, stream) {
  if (err) { throw err }

  stream
  .on('data', function (audio) {
    drawAudio(canvas, audio, 'blue')
  })
})

// https://github.com/meandavejustice/draw-wave/blob/master/index.js
function drawAudio (canvas, audio, color) {
  var ctx = canvas.getContext('2d')
  var width = canvas.width
  var height = canvas.height

  if (color) {
    ctx.fillStyle = color
  }
  
  ctx.clearRect(0, 0, width, height)

  var data = audio.data
  var step = Math.ceil( data.length / width )
  var amp = height / 2

  for(var i=0; i < width; i++){
    var min = 1.0
    var max = -1.0

    for (var j=0; j<step; j++) {
      var datum = data[(i*step)+j]
      if (datum < min)
        min = datum
      if (datum > max)
        max = datum
    }

    ctx.fillRect(i,(1+min)*amp,1,Math.max(1,(max-min)*amp))
  }
}
