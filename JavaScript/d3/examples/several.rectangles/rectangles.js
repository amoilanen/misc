document.addEventListener('DOMContentLoaded', function(event) {
  render();
});

function render() {
  var svg = d3.select('#chartContainer')
    .append('svg')
    .attr('width', 150)
    .attr('height', 150);

  var w = 50;
  var h = 50;
  var points = [
    {x: 0, y: 0},
    {x: 50, y: 50},
    {x: 100, y: 100}
  ];

  points.forEach(function(point) {
    svg.append('path')
      .attr('d', d3.svg.area()([[0, h], [w, h]]))
      .attr('transform', 'translate(' + point.x + ', ' + point.y + ')')
      .attr('class', 'rectangle')
      .attr('fill', 'blue');
  });
}