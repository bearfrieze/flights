var THREE = require('three')

var utils = {}

utils.edgeVector = function (axis, side, bounds) {
  var position = new THREE.Vector3()
  for (var i = 0; i < 2; i++) {
    if (axis === i) {
      position.setComponent(i, -bounds[i] / 2 + Math.random() * bounds[i])
    } else {
      position.setComponent(i, side === 0 ? -bounds[i] / 2 : bounds[i] / 2)
    }
  }
  return position
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

module.exports = utils
