(function(host) {

  //TODO: Molecules fly unbound, do not collide with each other or with the box
  //TODO: Molecules collide with the box and collisions are without energy loss
  //TODO: Molecules can collide with one another without energy loss

  //TODO: Compute the number of molecules hitting the walls of the box in unit of time (pressure P)

  //TODO: Introduce a parameter that will regulate what part of energy is lost when hitting a wall
  //TODO: Compute the average kinetic energy of the moving molecules (temperature)

  /*
   * Ideal gas. The mass of a single molecule is so small compared to its speed that we can
   * assume that the force of gravity is zero.
   */
  function IdealGasPhysicalWorld() {
    this.visibleFeatureNames = ['molecules'];
  }

  IdealGasPhysicalWorld.prototype = new PhysicalWorld();

  IdealGasPhysicalWorld.prototype.init = function() {

    //Number of molecules in the box
    this.numberOfMolecules = 10;

    //Average speed of a molecule, real speed is in the interval [0, 2 * this.averageSpeed]
    this.averageDimensionSpeed = 15;

    this.box = {
      x: 600,
      y: 600
    };

    this.moleculeRadius = 2;

    //Time is discrete in our physical world, this is the increment between two adjacent time values
    this.deltaT = 0.05;

    //Molecules, each molecule has coordinates
    this.molecules = this.createMolecules();
  };

  IdealGasPhysicalWorld.prototype.createMolecules = function() {
    var molecules = [];

    for (var i = 0; i < this.numberOfMolecules; i++) {
      molecules.push({
        x: Math.floor(Math.random() * this.box.x),
        y: Math.floor(Math.random() * this.box.y),
        Vx: Math.floor(Math.random() * this.averageDimensionSpeed),
        Vy: Math.floor(Math.random() * this.averageDimensionSpeed),
        r: this.moleculeRadius
      });
    }
    return molecules;
  };

  IdealGasPhysicalWorld.prototype.update = function() {
    var self = this;

    this.molecules.forEach(function(molecule) {
      molecule.x = molecule.x + molecule.Vx * self.deltaT;
      molecule.y = molecule.y + molecule.Vy * self.deltaT;
    });
  };

  /*
   * Display.
   */
  function IdealGasDisplay(displayElementSelector, canvasWidth, canvasHeight) {
    Display.call(this, displayElementSelector, canvasWidth, canvasHeight);
  }

  IdealGasDisplay.prototype = new host.Display();

  IdealGasDisplay.prototype.draw = function(world) {
    var self = this;
    var molecules = world.getVisibleFeatures().molecules;

    this.clear();
    molecules.forEach(function(molecule) {
      self.drawingContext.fillStyle = "black";
      self.drawingContext.beginPath();
      self.drawingContext.arc(molecule.x, molecule.y, molecule.r, 0, 2 * Math.PI, false);
      self.drawingContext.fill();
      self.drawingContext.stroke();
    });
  };

  Main.experiment(function() {
    return {
      display: new IdealGasDisplay("#display", 600, 600),
      physicalWorld: new IdealGasPhysicalWorld(),
      initialParameters: {
      }
    };
  });
})(this);