// This file is a part of wychess project.
// Copyright (c) 2021 wychess.com <wychess@wychess.com>.

function $SVG(elementName, elementAttributes={}) {
    let dom = document.createElementNS("http://www.w3.org/2000/svg", elementName)
    for(let attributeIndex in elementAttributes)
    {
        if (Number.isNaN(elementAttributes[attributeIndex])) {
            console.log(elementName, attributeIndex)
        }
        dom.setAttribute(attributeIndex, elementAttributes[attributeIndex]);
    }
    return dom;
}

function svg(attrs) {
    return $SVG('svg', attrs)
}

function g(attrs) {
    return $SVG('g', attrs)
}

function polygon(attrs) {
    return $SVG('polygon', attrs)
}

function line(x0, y0, x1, y1, color, width) {
    return $SVG('line', {'x1': x0, 'y1': y0, 'x2': x1, 'y2': y1, 'style': 'stroke: ' + color + '; stroke-width: ' + width})
}

function grounded_trapezoid(x0, y0, x1, y1, fill) {
    let points = x0 + ',0 ' + x1 + ',0 ' + x1 + ',' + y1 + ' ' + x0 + ',' + y0
    return polygon({'points': points, 'style': 'fill: ' + fill})
}

function box(x0, y0, x1, y1, fill) {
    let points =
        x0 + ',' + y0 + ' ' +
        x1 + ',' + y0 + ' ' +
        x1 + ',' + y1 + ' ' +
        x0 + ',' + y1 + ' ' +
        x0 + ',' + y0
    return polygon({'points': points, 'style': 'fill: ' + fill})
}

function circle(x, y, color, r) {
    return $SVG('circle', {'cx': x, 'cy': y, 'r': r, 'fill': color})
}

function path(pts, color, size) {
    return $SVG('path', {
        'd': 'M' + pts.join(' '),
        'stroke-width': size,
        'stroke-linejoin': "round",
        'stroke': color,
        'fill': color
    })
}
