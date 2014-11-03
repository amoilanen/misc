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

  //Subclasses should implement this method
  Display.prototype.draw = function(features) {
  };

  host.Display = Display;
})(this);