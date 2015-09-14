'use strict'

function svg (tag, attributes) {
  var element = document.createElementNS('http://www.w3.org/2000/svg', tag)
  for (let key in attributes) element.setAttribute(key, attributes[key])
  return element
}

function point (e) {
  return [e.offsetX, e.offsetY]
}

function distance (one, two) {
  return Math.sqrt(Math.pow(two[0] - one[0], 2) + Math.pow(two[1] - one[1], 2))
}

function between (one, two, units) {
  var fraction = units / distance(one, two)
  return [
    one[0] + (two[0] - one[0]) * fraction,
    one[1] + (two[1] - one[1]) * fraction
  ]
}

// function bounds (element) {
//   return [element.offsetWidth, element.offsetHeight]
// }

class Route {
  constructor (origin, canvas) {
    this.points = []
    this.element = svg('polyline')
    this.addPoint(origin)
    this.location = origin
    this.progress = 0
  }
  addPoint (point) {
    var last = this.points[this.points.length - 1]
    if (this.points.length && distance(last, point) < 20.0) return
    this.points.push(point)
    this.render()
  }
  travel (units) {
    this.progress += units
    while (this.points.length > 1) {
      var dist = distance(this.points[0], this.points[1])
      if (this.progress < dist) break
      this.progress -= dist
      this.points.shift()
    }
    this.render()
    if (this.points.length === 1) return this.location = this.points[0]
    this.location = between(this.points[0], this.points[1], this.progress)
  }
  render () {
    this.element.setAttribute('points', this.points.map(p => p.join()).join(' '))
  }
}

class Draggable {
  constructor (element, canvas) {
    element.addEventListener('mousedown', e => {
      this.down(e)
      var drag = this.drag.bind(this)
      var up = e => {
        this.up(e)
        canvas.removeEventListener('mousemove', drag)
        canvas.removeEventListener('mouseup', up)
      }
      canvas.addEventListener('mousemove', drag)
      canvas.addEventListener('mouseup', up)
    })
    this.element = element
    this.canvas = canvas
  }
}

class Flight extends Draggable {
  constructor (start, stop, element, canvas) {
    super(element, canvas)
    this.route = new Route(start, this.canvas)
    this.canvas.insertBefore(this.route.element, this.canvas.firstChild)
    this.route.addPoint(stop)
  }
  down (e) {
    console.log('down')
    if (this.route) this.canvas.removeChild(this.route.element)
    this.route = new Route(point(e), this.canvas)
    this.canvas.insertBefore(this.route.element, this.canvas.firstChild)
  }
  drag (e) {
    var p = point(e)
    this.route.addPoint(p)
  }
  up () {
    console.log('up')
  }
  step () {
    this.route.travel(0.5)
  }
  render () {
    this.element.setAttribute('cx', this.route.location[0])
    this.element.setAttribute('cy', this.route.location[1])
  }
}

class Game {
  constructor () {
    this.canvas = document.body.appendChild(svg('svg', {
      width: '100%',
      height: '100%'
    }))
    this.flights = []
    this.bounds = [this.canvas.offsetWidth, this.canvas.offsetHeight]
    for (var i = 0; i < 1; i++) this.spawnFlight()
  }
  spawnFlight () {
    var circle = this.canvas.appendChild(svg('circle', {r: 20}))
    var axis = Math.round(Math.random())
    var side = Math.round(Math.random())
    var start = this.edgePosition(axis, side)
    var stop = this.edgePosition(axis, (side + 1) % 2)
    this.flights.push(new Flight(start, stop, circle, this.canvas))
  }
  step () {
    this.flights.forEach(f => {
      f.step()
      f.render()
    })
  }
  edgePosition (axis, side) {
    var position = []
    for (var i = 0; i < 2; i++) {
      if (axis === i) {
        position[i] = Math.random() * this.bounds[i]
      } else {
        position[i] = side * this.bounds[i]
      }
    }
    return position
  }
}

var game = new Game()
var loop = () => {
  game.step()
  window.requestAnimationFrame(loop)
}
window.requestAnimationFrame(loop)
