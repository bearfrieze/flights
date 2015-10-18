var THREE = require('three')

var utils = {}

utils.bounds = function () {
  return [document.body.offsetWidth, document.body.offsetHeight]
}

utils.pointerify = function (parent, canvas) {
  var point = function (e) {
    var pointer
    if ('changedTouches' in e) {
      pointer = new THREE.Vector3(e.changedTouches[0].pageX, e.changedTouches[0].pageY)
    } else if ('targetTouches' in e) {
      pointer = new THREE.Vector3(e.targetTouches[0].pageX, e.targetTouches[0].pageY)
    } else {
      pointer = new THREE.Vector3(e.offsetX, e.offsetY)
    }
    pointer.x -= canvas.offsetWidth/2
    pointer.y = canvas.offsetHeight/2 - pointer.y
    return pointer
  }
  var listeners = [
    {name: 'mousedown', action: parent.down},
    {name: 'touchstart', action: parent.down},
    {name: 'mousemove', action: parent.move},
    {name: 'touchmove', action: parent.move},
    {name: 'mouseup', action: parent.up},
    {name: 'touchend', action: parent.up},
  ]
  for (let listener of listeners) {
    canvas.addEventListener(listener.name, e => {
      listener.action.bind(parent)(point(e))
      e.stopPropagation()
      e.preventDefault()
    })
  }
}

utils.requestFullscreen = function (element) {
  // https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
  if (element.requestFullscreen) {
    element.requestFullscreen()
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen()
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen()
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen()
  }
}

utils.bestCandidate = function (bounds, vectors, iterations) {
  var tmp = new THREE.Vector3()
  var res = new THREE.Vector3()
  var max = -Infinity
  for (let i = 0; i < iterations; i++) {
    bounds.forEach((b, i) => tmp.setComponent(i, -b / 2 + Math.random() * b))
    var min = vectors.reduce((min, v) => {
      return Math.min(min, v.distanceTo(tmp))
    }, Infinity)
    if (min > max) {
      max = min
      res.copy(tmp.clone())
    }
  }
  return res
}

module.exports = utils
