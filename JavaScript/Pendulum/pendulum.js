var canvasWidth = 350;
var canvasHeight = 350;
var animationIntervalMs = 20;

var animationInterval;

var coordinatesZero = {
  x: canvasWidth / 2,
  y: canvasWidth / 2
};

var drawingContext;

var parameters = {
  'alpha': '- 99 * Math.PI / 100',
  'beta': '0.003'
};

/*
 * Physical characteristics.
 */
//Radius of the pendulum
var pendulumRadius = 10;

//Length of the string
var l = 150;

//Angle of the pendulum
var alpha = parameters.alpha;

//Resistance coefficient of the environment
var beta = parameters.beta;

//Time is discrete in our physical world, this is the increment between two adjacent time values
var deltaT = 0.1;

//Mass of the pendulum
var m = 10;

//Initial value of the radial speed
var omega = 0;

//Earth gravity acceleration
var g = 9.81;

/*
 * Laws of Physics.
 */
function updatePhysicalValues() {
  omega = omega + (-(g * Math.sin(alpha)) / l - (beta * l * omega) / m) * deltaT;
  alpha = alpha + omega * deltaT;
}

/*
 * Drawing.
 */
function getDrawingContext() {
  var display = document.querySelector("#display");
  var drawingContext = display.getContext("2d");

  display.width = canvasWidth;
  display.height = canvasHeight;
  return drawingContext;
}

function drawPendulum(alpha, l) {
  var coordinates = {
    x: l * Math.sin(alpha),
    y: l * Math.cos(alpha)
  };

  var displayCoordinates = {
    x: coordinatesZero.x + coordinates.x,
    y: coordinatesZero.y + coordinates.y
  };

  drawingContext.clearRect(0, 0, canvasWidth, canvasHeight);
  drawingContext.fillStyle = "black";
  drawingContext.beginPath();
  drawingContext.arc(displayCoordinates.x, displayCoordinates.y, pendulumRadius, 0, 2 * Math.PI, false);
  drawingContext.fill();
  drawingContext.moveTo(coordinatesZero.x, coordinatesZero.y);
  drawingContext.lineTo(displayCoordinates.x, displayCoordinates.y);
  drawingContext.stroke();
}

function runSimulation() {
  alpha = eval(parameters.alpha);
  beta = eval(parameters.beta);

  if (animationInterval) {
    clearInterval(animationInterval);
  }
  animationInterval = setInterval(function() {
    drawPendulum(alpha, l);
    updatePhysicalValues();
  }, animationIntervalMs);
}

function bindParameter(name) {
  var inputElement = document.querySelector("#" + name);

  inputElement.value = parameters[name];
  inputElement.addEventListener("blur", function(event) {
    parameters[name] = this.value;
    runSimulation();
  });
  inputElement.addEventListener("keyup", function(event) {
    //Enter
    if (event.keyCode == 13) {
      this.blur();
    }
  });
}

function bindParameters() {
  for (var parameter in parameters) {
    bindParameter(parameter);
  }
}

function init() {
  bindParameters();
  drawingContext = getDrawingContext();
  runSimulation();
}

window.addEventListener("load", init);