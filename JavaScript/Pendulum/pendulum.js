var canvasWidth = 400;
var canvasHeight = 400;
var animationIntervalMs = 100;

var drawingContext;

/*
 * Physical characteristics.
 */
var pendulumRadius = 5;
var l = 100;
var alpha = -Math.PI / 4;

var coordinatesZero = {
  x: canvasWidth / 2,
  y: canvasHeight / 2
};

function computeCoordinates(alpha, l) {
  return {
    x: l * Math.sin(alpha),
    y: l * Math.cos(alpha)
  };
}

function drawPendulum(alpha, l) {
  var coordinates = computeCoordinates(alpha, l);
  var displayCoordinates = {
    x: coordinatesZero.x + coordinates.x,
    y: coordinatesZero.y + coordinates.y
  };

  drawingContext.clearRect(0, 0, canvasWidth, canvasHeight);
  drawingContext.beginPath();
  drawingContext.arc(displayCoordinates.x, displayCoordinates.y, pendulumRadius, 0, 2 * Math.PI, false);
  drawingContext.fill();
  drawingContext.moveTo(coordinatesZero.x, coordinatesZero.y);
  drawingContext.lineTo(displayCoordinates.x, displayCoordinates.y);
  drawingContext.stroke();
}

function init() {
  var display = document.querySelector("#display");

  display.width = canvasWidth;
  display.height = canvasHeight;
  drawingContext = display.getContext("2d");
  drawingContext.fillStyle = "black";

  var alphas = [-Math.PI / 4, -Math.PI / 5, -Math.PI / 6, -Math.PI / 7, -Math.PI / 8];
  var i = 0;

  var animationInterval = setInterval(function() {
    if (i < alphas.length) {
      drawPendulum(alphas[i], l);
      i++;
    } else {
      clearInterval(animationInterval);
    }
  }, animationIntervalMs);
}

window.addEventListener("load", init);