var utils = require('./utils.es6')
var Game = require('./game.es6')

// var element = document.documentElement
// var fullscreen = () => {
//   utils.requestFullscreen(document.documentElement)
//   element.removeEventListener('mousedown', fullscreen)
//   element.removeEventListener('touchdown', fullscreen)
  var game = new Game()
  var loop = () => {
    if (!game.step()) {
      game.reset()
      return setTimeout(loop, 1000)
    }
    game.render()
    window.requestAnimationFrame(loop)
  }
  window.requestAnimationFrame(loop)
// }
// element.addEventListener('mousedown', fullscreen)
// element.addEventListener('touchdown', fullscreen)
