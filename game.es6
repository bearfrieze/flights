var THREE = require('three')
var utils = require('./utils.es6')
var materials = require('./materials.es6')
var Ufo = require('./ufo.es6')
var Target = require('./Target.es6')

module.exports = class Game {
  constructor () {
    var bounds = utils.bounds()
    this.scale = Math.sqrt(Math.pow(bounds[0], 2) + Math.pow(bounds[1], 2)) / Math.pow(10, 3)
    this.scene = new THREE.Scene()
    this.camera = new THREE.OrthographicCamera(bounds[0] / - 2, bounds[0] / 2, bounds[1] / 2, bounds[1] / - 2, 1, 1000)
    this.camera.position.z = 1
    this.renderer = new THREE.WebGLRenderer({alpha: true, antialias: true})
    this.renderer.setSize(bounds[0], bounds[1])
    this.renderer.sortObjects = true
    document.body.appendChild(this.renderer.domElement)
    utils.pointerify(this, this.renderer.domElement)
    this.difficulty = 5
    this.reset()
  }
  reset () {
    if (this.ufos) this.ufos.forEach(ufo => ufo.destroy())
    if (this.targets) this.targets.forEach(target => target.destroy())
    this.ufos = []
    this.targets = [new Target(new THREE.Vector3(), this.scale * 25, this.scene)]
    this.spawnUfo()
    clearInterval(this.spawnInterval)
    this.spawnInterval = setInterval(() => {
      if (this.ufos.length < this.difficulty) this.spawnUfo()
    }, 5000)
  }
  spawnUfo () {
    var start = utils.edgeVector(
      Math.round(Math.random()),
      Math.round(Math.random())
    )
    this.ufos.push(new Ufo(start, this.scale * 30, this.scale / 20, this.scene))
  }
  step (ms) {
    this.ufos.forEach(ufo => {
      ufo.step(ms)
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
        } else if (distance < ufo.radius * 2) {
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
    return true
  }
  render () {
    this.renderer.render(this.scene, this.camera)
  }
  down (p) {
    var min = Infinity
    this.selected = false
    for (let ufo of this.ufos) {
      let distance = p.distanceTo(ufo.route.position)
      if (distance < ufo.radius * 3) {
        if (min < distance) continue
        this.selected = ufo
        min = distance
      }
    }
    if (this.selected) this.selected.down(p)
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
