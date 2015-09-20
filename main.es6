var THREE = require('three')

const MAX_POINTS = 500

function edgeVector (axis, side) {
  var bounds = [window.innerWidth, window.innerHeight]
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

function point (e) {
  var pointer
  if ('changedTouches' in e) {
    pointer = new THREE.Vector3(e.changedTouches[0].pageX, e.changedTouches[0].pageY)
  } else if ('targetTouches' in e) {
    pointer = new THREE.Vector3(e.targetTouches[0].pageX, e.targetTouches[0].pageY)
  } else {
    pointer = new THREE.Vector3(e.offsetX, e.offsetY)
  }
  pointer.x -= window.innerWidth/2
  pointer.y = window.innerHeight/2 - pointer.y
  return pointer
}

function pointerify (parent, canvas) {
  var listener = e => {
    parent.down(point(e))
    var move = e => {
      parent.move(point(e))
      e.stopPropagation()
      e.preventDefault()
    }
    var up = e => {
      parent.up(point(e))
      e.stopPropagation()
      e.preventDefault()
    }
    canvas.addEventListener('mousemove', move)
    canvas.addEventListener('mouseup', up)
    canvas.addEventListener('touchmove', move)
    canvas.addEventListener('touchend', up)
    e.stopPropagation()
    e.preventDefault()
  }
  canvas.addEventListener('mousedown', listener)
  canvas.addEventListener('touchstart', listener)
}

function requestFullscreen(element) {
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

class Route {
  constructor (origin, scene) {
    var material = new THREE.LineBasicMaterial({color: 0x000000, linewidth: 1})
    var geometry = new THREE.BufferGeometry()
    var positions = new Float32Array(MAX_POINTS * 3)
    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setDrawRange(0, 2)
    this.mesh = new THREE.Line(geometry, material)
    this.mesh.renderOrder = 0
    scene.add(this.mesh)
    this.scene = scene
    this.reset(origin)
  }
  addPoint (point) {
    var last = this.points[this.points.length - 1]
    if (this.points.length && last.distanceTo(point) < 10.0) return
    this.points.push(point)
    this.render()
  }
  travel (units) {
    this.progress += units
    var changed = false
    while (this.points.length > 1) {
      var dist = this.points[0].distanceTo(this.points[1])
      if (this.progress < dist) break
      this.progress -= dist
      this.points.shift()
      changed = true
    }
    if (changed) this.render()
    if (this.points.length === 1) {
      if (!this.drawing) {
        this.addPoint(edgeVector(Math.round(Math.random()), Math.round(Math.random())))
      } else {
        return
      }
    }
    this.location = this.points[1].clone()
      .sub(this.points[0])
      .setLength(this.progress)
      .add(this.points[0])
  }
  render () {
    var positions = this.mesh.geometry.attributes.position.array
    for (var i = 0; i < this.points.length && i < MAX_POINTS; i++) {
      positions[i * 3 + 0] = this.points[i].x
      positions[i * 3 + 1] = this.points[i].y
    }
    this.mesh.geometry.setDrawRange(0, this.points.length)
    this.mesh.geometry.attributes.position.needsUpdate = true
  }
  reset (point) {
    this.progress = 0
    this.points = []
    this.addPoint(point)
    this.location = point
  }
  destroy () {
    this.scene.remove(this.mesh)
  }
}

class Flight {
  constructor (start, stop, radius, scene) {
    this.route = new Route(start, scene)
    this.route.addPoint(stop)
    this.radius = radius
    var material = new THREE.MeshBasicMaterial()
    var geometry = new THREE.CircleGeometry(radius, 32)
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.renderOrder = 1
    this.render()
    scene.add(this.mesh)
    this.scene = scene
  }
  down (point) {
    this.route.reset(this.route.location)
    this.route.drawing = true
  }
  move (point) {
    this.route.addPoint(point)
  }
  up (point) {
    this.route.drawing = false
  }
  step () {
    this.route.travel(0.5)
  }
  render () {
    this.mesh.position.copy(this.route.location)
    this.mesh.material.color.setStyle(this.colliding ? 'red' : 'black')
  }
  distanceTo (flight) {
    return this.route.location.distanceTo(flight.route.location) - this.radius - flight.radius
  }
  destroy () {
    this.scene.remove(this.mesh)
    this.route.destroy()
  }
}

class Game {
  constructor () {
    var width = window.innerWidth
    var height = window.innerHeight
    this.scene = new THREE.Scene()
    this.camera = new THREE.OrthographicCamera(width / - 2, width / 2, height / 2, height / - 2, 1, 1000)
    this.camera.position.z = 1
    this.renderer = new THREE.WebGLRenderer({alpha: true, antialias: true})
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.sortObjects = true
    document.body.appendChild(this.renderer.domElement)
    pointerify(this, this.renderer.domElement)
    this.flights = []
    this.difficulty = 10
  }
  spawnFlight () {
    var axis = Math.round(Math.random())
    var side = Math.round(Math.random())
    var start = edgeVector(axis, side)
    var stop = edgeVector(axis, (side + 1) % 2)
    this.flights.push(new Flight(start, stop, 20, this.scene))
  }
  step () {
    this.flights.forEach(flight => {
      flight.step()
      flight.colliding = false
    })
    for (var i = 0; i < this.flights.length; i++) {
      var flight = this.flights[i]
      for (var j = 0; j < i; j++) {
        var other = this.flights[j]
        var distance = flight.distanceTo(other)
        if (distance <= 0) {
          flight.crashed = true
          other.crashed = true
        } else if (distance < 50) {
          flight.colliding = true
          other.colliding = true
        }
      }
    }
    for (var i = 0; i < this.flights.length; i++) {
      var flight = this.flights[i]
      if (flight.crashed) {
        this.flights.splice(i, 1)
        flight.destroy()
        continue
      }
      flight.render()
    }
    while (this.flights.length < this.difficulty) this.spawnFlight()
  }
  render () {
    this.renderer.render(this.scene, this.camera)
  }
  down (p) {
    for (let flight of this.flights) {
      if (p.distanceTo(flight.route.location) < flight.radius * 1.5) {
        this.selected = flight
        flight.down(p)
      }
    }
  }
  move (p) {
    if (!this.selected) return
    this.selected.move(p)
  }
  up (p) {
    if (!this.selected) return
    this.selected.up(p)
    this.selected = false
  }
}

var element = document.documentElement
var fullscreen = () => {
  requestFullscreen(document.documentElement)
  element.removeEventListener('mousedown', fullscreen)
  element.removeEventListener('touchdown', fullscreen)
  setTimeout(() => {
    var game = new Game()
    var loop = () => {
      game.step()
      game.render()
      window.requestAnimationFrame(loop)
    }
    window.requestAnimationFrame(loop)
  }, 500)
}
element.addEventListener('mousedown', fullscreen)
element.addEventListener('touchdown', fullscreen)
