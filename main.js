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
    this.element.setAttribute('points', this.points.map(p => p.join()).join(' '))
  }
  travel (units) {
    this.progress += units
    var accumulated = 0
    for (var i = 0; i < this.points.length - 1; i++) {
      var dist = distance(this.points[i], this.points[i + 1])
      if (this.progress < accumulated + dist) {
        var delta = this.progress - accumulated
        return this.location = between(this.points[i], this.points[i + 1], delta)
      }
      accumulated += dist
    }
    return this.location = this.points[this.points.length - 1]
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
  constructor (x, y, element, canvas) {
    super(element, canvas)
    this.route = new Route([x, y], this.canvas)
    this.canvas.insertBefore(this.route.element, this.canvas.firstChild)
    this.route.addPoint([
      x - 250 + Math.random() * 500,
      y - 250 + Math.random() * 500
    ])
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

var body = document.body
var canvas = body.appendChild(svg('svg', {
  width: '500',
  height: '500',
  viewBox: '0 0 500 500'
}))
var flights = []
for (var i = 0; i < 10; i++) {
  var circle = canvas.appendChild(svg('circle', {r: 20}))
  flights.push(new Flight(250, 250, circle, canvas))
}

var step = () => {
  flights.forEach(f => {
    f.step()
    f.render()
  })
  window.requestAnimationFrame(step)
}
window.requestAnimationFrame(step)
