var THREE = require('three')
var materials = require('./materials.es6')
var Route = require('./route.es6')

module.exports = class Ufo {
  constructor (start, radius, speed, game) {
    this.route = new Route(start, this, game)
    this.position = this.route.position
    this.radius = radius
    this.speed = speed
    this.game = game
    var material = new THREE.MeshBasicMaterial()
    var geometry = new THREE.CircleGeometry(radius, 32)
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.renderOrder = 2
    this.render()
    this.game.scene.add(this.mesh)
    this.spawning = true
    setTimeout(() => this.spawning = false, 1500)
  }
  down (point) {
    this.route.reset(this.position)
    this.route.drawing = true
    this.goal = false
  }
  move (point) {
    this.route.addPoint(point)
  }
  up (point) {
    this.route.drawing = false
  }
  step (ms) {
    if (this.spawning) return
    this.route.travel(this.speed * ms)
  }
  render () {
    this.mesh.position.copy(this.position)
    var color = this.mesh.material.color
    if (this.spawning) return color.setStyle('darkgray')
    if (this.colliding) return color.setStyle('red')
    if (this.goal) return color.setStyle('green')
    color.setStyle('black')
  }
  distanceTo (ufo) {
    return this.position.distanceTo(ufo.position) - this.radius - ufo.radius
  }
  destroy () {
    this.game.scene.remove(this.mesh)
    this.route.destroy()
  }
}
