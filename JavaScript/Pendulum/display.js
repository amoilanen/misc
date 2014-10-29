/*
 * Visualization of the features of the physical world.
 */
(function(host) {

  function Display(displayElementSelector, canvasWidth, canvasHeight) {
    this.drawingContext = null;
    this.displayElementSelector = displayElementSelector;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.coordinatesZero = {
      x: canvasWidth / 2,
      y: canvasWidth / 2
    };
  }

  Display.prototype.init = function() {
    var displayElement = document.querySelector(this.displayElementSelector);

    displayElement.width = this.canvasWidth;
    displayElement.height = this.canvasWidth;
    this.drawingContext = displayElement.getContext("2d");
  };

  Display.prototype.draw = function(features) {
    var coordinates = {
      x: features["l"] * Math.sin(features["alpha"]),
      y: features["l"] * Math.cos(features["alpha"])
    };

    var displayCoordinates = {
      x: this.coordinatesZero.x + coordinates.x,
      y: this.coordinatesZero.y + coordinates.y
    };

    this.drawingContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.drawingContext.fillStyle = "black";
    this.drawingContext.beginPath();
    this.drawingContext.arc(displayCoordinates.x, displayCoordinates.y, features["pendulumRadius"], 0, 2 * Math.PI, false);
    this.drawingContext.fill();
    this.drawingContext.moveTo(this.coordinatesZero.x, this.coordinatesZero.y);
    this.drawingContext.lineTo(displayCoordinates.x, displayCoordinates.y);
    this.drawingContext.stroke();
  };

  host.Display = Display;
})(this);