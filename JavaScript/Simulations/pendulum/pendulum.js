(function(host) {

  /*
   * Physical world.
   */
  function PendulumPhysicalWorld() {
    this.visibleFeatureNames = ['alpha', 'l', 'pendulumRadius'];
  }

  PendulumPhysicalWorld.prototype = new PhysicalWorld();

  PendulumPhysicalWorld.prototype.init = function() {

    //Angle of the pendulum
    this.alpha = null;

    //Resistance coefficient of the environment
    this.beta = null;

    //Length of the string
    this.l = 150;

    //Initial value of the radial speed
    this.omega = 0;

    //Radius of the pendulum
    this.pendulumRadius = 10;

    //Earth gravity acceleration
    this.g = 9.81;

    //Time is discrete in our physical world, this is the increment between two adjacent time values
    this.deltaT = 0.1;

    //Mass of the pendulum
    this.m = 10;
  };

  PendulumPhysicalWorld.prototype.update = function() {
    this.omega = this.omega + (-(this.g * Math.sin(this.alpha)) / this.l
                                   - (this.beta * this.l * this.omega) / this.m) * this.deltaT;
    this.alpha = this.alpha + this.omega * this.deltaT;
  };

  /*
   * Display.
   */
  function PendulumDisplay(displayElementSelector, canvasWidth, canvasHeight) {
    Display.call(this, displayElementSelector, canvasWidth, canvasHeight);
  }

  PendulumDisplay.prototype = new host.Display();

  PendulumDisplay.prototype.draw = function(world) {
    var features = world.getVisibleFeatures();
    var coordinates = {
      x: features["l"] * Math.sin(features["alpha"]),
      y: features["l"] * Math.cos(features["alpha"])
    };

    var displayCoordinates = {
      x: this.coordinatesZero.x + coordinates.x,
      y: this.coordinatesZero.y + coordinates.y
    };

    this.clear();
    this.drawingContext.fillStyle = "black";
    this.drawingContext.beginPath();
    this.drawingContext.arc(displayCoordinates.x, displayCoordinates.y, features["pendulumRadius"], 0, 2 * Math.PI, false);
    this.drawingContext.fill();
    this.drawingContext.moveTo(this.coordinatesZero.x, this.coordinatesZero.y);
    this.drawingContext.lineTo(displayCoordinates.x, displayCoordinates.y);
    this.drawingContext.stroke();
  };

  Main.experiment(function() {
    return {
      display: new PendulumDisplay("#display", 350, 350),
      physicalWorld: new PendulumPhysicalWorld(),
      initialParameters: {
        'alpha': '- 2pi/3',
        'beta': '0.003'
      }
    };
  });
})(this);