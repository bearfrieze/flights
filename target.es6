var THREE = require('three')

module.exports = class Target {
  constructor (position, radius, scene) {
    this.position = position
    this.radius = radius
    this.scene = scene
    var material = new THREE.MeshBasicMaterial()
    var geometry = new THREE.CircleGeometry(radius, 32)
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.copy(position)
    this.mesh.renderOrder = 1
    scene.add(this.mesh)
  }
  destroy () {
    this.scene.remove(this.mesh)
  }
}
