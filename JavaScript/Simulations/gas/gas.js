(function(host) {

  //TODO: Compute the number of molecules hitting the walls of the box in unit of time (pressure P)

  //TODO: Introduce a parameter that will regulate what part of energy is lost when hitting a wall
  //TODO: Compute the average kinetic energy of the moving molecules (temperature)

  /*
   * Ideal gas. The mass of a single molecule is so small compared to its speed that we can
   * assume that the force of gravity is zero and the forces of gravity in between molecules are negligible.
   */
  function IdealGasPhysicalWorld() {
    this.visibleFeatureNames = ['molecules'];
  }

  IdealGasPhysicalWorld.prototype = new PhysicalWorld();

  IdealGasPhysicalWorld.prototype.init = function() {

    //Number of molecules in the box
    this.numberOfMolecules = 100;

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
        V: {
          x: (Math.random() < 0.5 ? -1 : 1) * Math.floor(Math.random() * this.averageDimensionSpeed),
          y: (Math.random() < 0.5 ? -1 : 1) * Math.floor(Math.random() * this.averageDimensionSpeed)
        },
        r: this.moleculeRadius
      });
    }
    return molecules;
  };

  IdealGasPhysicalWorld.prototype.update = function() {
    var self = this;

    this.molecules.forEach(function(molecule) {
      molecule.x = molecule.x + molecule.V.x * self.deltaT;
      molecule.y = molecule.y + molecule.V.y * self.deltaT;
    });

    this.molecules.forEach(function(molecule) {
      if ((molecule.x > self.box.x) || (molecule.x < 0)) {
        molecule.V.x = -molecule.V.x;
      }
      if ((molecule.y > self.box.y) || (molecule.y < 0)) {
        molecule.V.y = -molecule.V.y;
      }
    });
    this.molecules.forEach(function(molecule1, idx) {
      self.molecules.slice(idx + 1).forEach(function(molecule2) {
        var distance = Math.sqrt(Math.pow(molecule1.x - molecule2.x) + Math.pow(molecule1.y - molecule2.y));

        //Collision, impulse and energy are preserved, masses of molecules are same
        if (distance <= molecule1.r + molecule2.r) {
          var molecule1V = molecule1.V;

          molecule1.V = molecule2.V;
          molecule2.V = molecule1V;
        }
      });
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
      self.drawMolecule(molecule);
    });
  };

  IdealGasDisplay.prototype.drawMolecule = function(molecule) {
    this.drawingContext.fillStyle = "black";
    this.drawingContext.beginPath();
    this.drawingContext.arc(molecule.x, molecule.y, molecule.r, 0, 2 * Math.PI, false);
    this.drawingContext.fill();
    this.drawingContext.stroke();
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