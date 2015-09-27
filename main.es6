var THREE = require('three')

const MAX_POINTS = 500

var width = screen.width
var height = screen.height

var materials = {
  route: new THREE.LineBasicMaterial({color: 0x000000, linewidth: 1}),
}

function edgeVector (axis, side) {
  var bounds = [width, height]
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
  pointer.x -= width/2
  pointer.y = height/2 - pointer.y
  return pointer
}

function pointerify (parent, canvas) {
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
  constructor (origin, ufo, scene) {
    this.ufo = ufo
    this.scene = scene
    var geometry = new THREE.BufferGeometry()
    var positions = new Float32Array(MAX_POINTS * 3)
    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setDrawRange(0, 2)
    this.mesh = new THREE.Line(geometry, materials.route)
    this.mesh.renderOrder = 1
    scene.add(this.mesh)
    this.reset(origin)
  }
  addPoint (point) {
    var last = this.points[this.points.length - 1]
    if (this.points.length && last.distanceTo(point) < 10.0) return
    this.points.push(point)
    this.render()
  }
  travel (units) {
    if (this.drawing && this.points.length === 1) return
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
    if (this.ufo.goal && this.points.length === 1) return this.ufo.landed = true
    while(this.points.length === 1) {
      this.addPoint(edgeVector(Math.round(Math.random()), Math.round(Math.random())))
    }
    this.position = this.points[1].clone()
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
    this.position = point
  }
  destroy () {
    this.scene.remove(this.mesh)
  }
}

class Target {
  constructor (position, radius, scene) {
    this.position = position
    this.radius = radius
    this.scene = scene
    var material = new THREE.MeshBasicMaterial()
    var geometry = new THREE.CircleGeometry(radius, 32)
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.copy(position)
    this.mesh.renderOrder = 0
    scene.add(this.mesh)
  }
}

class Ufo {
  constructor (start, stop, radius, scene) {
    this.route = new Route(start, this, scene)
    this.route.addPoint(stop)
    this.radius = radius
    var material = new THREE.MeshBasicMaterial()
    var geometry = new THREE.CircleGeometry(radius, 32)
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.renderOrder = 2
    this.render()
    scene.add(this.mesh)
    this.scene = scene
  }
  down (point) {
    this.route.reset(this.route.position)
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
    this.mesh.position.copy(this.route.position)
    var color = this.mesh.material.color
    if (this.colliding) return color.setStyle('red')
    if (this.goal) return color.setStyle('green')
    color.setStyle('black')
  }
  distanceTo (ufo) {
    return this.route.position.distanceTo(ufo.route.position) - this.radius - ufo.radius
  }
  destroy () {
    this.scene.remove(this.mesh)
    this.route.destroy()
  }
}

class Game {
  constructor () {
    this.scene = new THREE.Scene()
    this.camera = new THREE.OrthographicCamera(width / - 2, width / 2, height / 2, height / - 2, 1, 1000)
    this.camera.position.z = 1
    this.renderer = new THREE.WebGLRenderer({alpha: true, antialias: true})
    this.renderer.setSize(width, height)
    this.renderer.sortObjects = true
    document.body.appendChild(this.renderer.domElement)
    pointerify(this, this.renderer.domElement)
    this.ufos = []
    this.difficulty = 4
    this.targets = [new Target(new THREE.Vector3(), 40, this.scene)]
  }
  spawnUfo () {
    var axis = Math.round(Math.random())
    var side = Math.round(Math.random())
    var start = edgeVector(axis, side)
    var stop = edgeVector(axis, (side + 1) % 2)
    this.ufos.push(new Ufo(start, stop, 20, this.scene))
  }
  step () {
    this.ufos.forEach(ufo => {
      ufo.step()
      ufo.colliding = false
    })
    for (var i = 0; i < this.ufos.length; i++) {
      var ufo = this.ufos[i]
      for (var j = 0; j < i; j++) {
        var other = this.ufos[j]
        var distance = ufo.distanceTo(other)
        if (distance <= 0) {
          ufo.crashed = true
          other.crashed = true
        } else if (distance < 50) {
          ufo.colliding = true
          other.colliding = true
        }
      }
    }
    for (var i = 0; i < this.ufos.length; i++) {
      var ufo = this.ufos[i]
      if (ufo.landed) {
        this.ufos.splice(i, 1)
        ufo.destroy()
        continue
      }
      if (ufo.crashed) return false
      ufo.render()
    }
    while (this.ufos.length < this.difficulty) this.spawnUfo()
    return true
  }
  render () {
    this.renderer.render(this.scene, this.camera)
  }
  down (p) {
    for (let ufo of this.ufos) {
      if (p.distanceTo(ufo.route.position) < ufo.radius * 1.5) {
        this.selected = ufo
        ufo.down(p)
      }
    }
  }
  move (p) {
    if (!this.selected) return
    this.selected.move(p)
  }
  up (p) {
    if (!this.selected) return
    var points = this.selected.route.points
    var dist = points[points.length - 1].distanceTo(this.targets[0].position)
    this.selected.goal = dist < this.targets[0].radius
    this.selected.up(p)
    this.selected = false
  }
}

var element = document.documentElement
var fullscreen = () => {
  requestFullscreen(document.documentElement)
  element.removeEventListener('mousedown', fullscreen)
  element.removeEventListener('touchdown', fullscreen)
  var game = new Game()
  var loop = () => {
    if (!game.step()) return
    game.render()
    window.requestAnimationFrame(loop)
  }
  window.requestAnimationFrame(loop)
}
element.addEventListener('mousedown', fullscreen)
element.addEventListener('touchdown', fullscreen)
