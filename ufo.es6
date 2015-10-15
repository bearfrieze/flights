var THREE = require('three')
var materials = require('./materials.es6')
var Route = require('./route.es6')

module.exports = class Ufo {
  constructor (start, radius, scene) {
    this.route = new Route(start, this, scene)
    this.radius = radius
    var material = new THREE.MeshBasicMaterial()
    var geometry = new THREE.CircleGeometry(radius, 32)
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.renderOrder = 2
    this.render()
    scene.add(this.mesh)
    this.scene = scene
    this.spawning = true
    setTimeout(() => this.spawning = false, 1500)
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
    if (this.spawning) return
    this.route.travel(0.5)
  }
  render () {
    this.mesh.position.copy(this.route.position)
    var color = this.mesh.material.color
    if (this.spawning) return color.setStyle('darkgray')
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
