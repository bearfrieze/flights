var utils = require('./utils.es6')
var Game = require('./game.es6')

// var element = document.documentElement
// var fullscreen = () => {
//   utils.requestFullscreen(document.documentElement)
//   element.removeEventListener('mousedown', fullscreen)
//   element.removeEventListener('touchdown', fullscreen)
  var lastFrame = 0
  var game = new Game()
  var loop = ts => {
    if (!game.step(ts - lastFrame)) {
      game.reset()
      return setTimeout(loop, 1000)
    }
    game.render()
    lastFrame = ts
    window.requestAnimationFrame(loop)
  }
  window.requestAnimationFrame(loop)
// }
// element.addEventListener('mousedown', fullscreen)
// element.addEventListener('touchdown', fullscreen)
