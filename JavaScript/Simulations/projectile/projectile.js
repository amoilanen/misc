(function(host) {

  /*
   * Physical world.
   */
  function ProjectilePhysicalWorld() {
    this.visibleFeatureNames = ['x', 'y'];
  }

  ProjectilePhysicalWorld.prototype = new PhysicalWorld();

  ProjectilePhysicalWorld.prototype.init = function() {

    //Speed of wind, negative - headwind, positive - tailwind
    this.Vwind = null;

    //Speed of the projectile
    this.V = null;

    //Resistance coefficient of the environment
    this.beta = null;

    //Initial angle
    this.alpha = null;

    //Mass
    this.m = null;

    //Earth gravity acceleration
    this.g = 9.81;

    //Initial coordinates
    this.x = 0;
    this.y = 1;

    //Time is discrete in our physical world, this is the increment between two adjacent time values
    this.deltaT = 0.05;
  };

  ProjectilePhysicalWorld.prototype.updateParameters = function(parameters) {
    PhysicalWorld.prototype.updateParameters.call(this, parameters);
    this.x = 0;
    this.y = 1;
    this.Vx = this.V * Math.cos(this.alpha);
    this.Vy = this.V * Math.sin(this.alpha);
  };

  ProjectilePhysicalWorld.prototype.update = function() {
    //Fell down to the ground
    if (this.y <= 0) {
      return;
    }

    this.Vx = this.Vx * (1 - this.beta * this.deltaT / this.m);
    this.Vy = this.Vy * (1 - this.beta * this.deltaT / this.m) - this.g * this.deltaT;
    this.x = this.x + (this.Vx + this.Vwind) * this.deltaT;
    this.y = this.y + this.Vy * this.deltaT;
  };

  /*
   * Display.
   */
  function ProjectileDisplay(displayElementSelector, canvasWidth, canvasHeight) {
    Display.call(this, displayElementSelector, canvasWidth, canvasHeight);
    this.coordinatesZero = {
      x: 0,
      y: canvasHeight
    };
    this.projectileRadius = 1;
  }

  ProjectileDisplay.prototype = new host.Display();

  ProjectileDisplay.prototype.draw = function(world) {
    var features = world.getVisibleFeatures();
    var coordinates = {
      x: features["x"],
      y: features["y"]
    };

    var displayCoordinates = {
      x: this.coordinatesZero.x + coordinates.x,
      y: this.coordinatesZero.y - coordinates.y
    };

    //this.clear();
    this.drawingContext.fillStyle = "black";
    this.drawingContext.beginPath();
    this.drawingContext.arc(displayCoordinates.x, displayCoordinates.y, this.projectileRadius, 0, 2 * Math.PI, false);
    this.drawingContext.fill();
    this.drawingContext.stroke();
  };

  Main.experiment(function() {
    return {
      display: new ProjectileDisplay("#display", 800, 400),
      physicalWorld: new ProjectilePhysicalWorld(),
      initialParameters: {
        'Vwind': '-25',
        'V': '150',
        'beta': '15',
        'alpha': '3pi/16',
        'm': '100'
      }
    };
  });
})(this);