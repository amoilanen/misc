(function(host) {

  function Main() {
    this.experimentConstructor = null;
  }

  Main.prototype.experiment = function(experimentConstructor) {
    this.experimentConstructor = experimentConstructor;
  };

  Main.prototype.run = function() {
    var experiment = this.experimentConstructor();

    var parameters = new Parameters();
    var display = experiment.display;
    var physicalWorld = experiment.physicalWorld;
    physicalWorld.init();
    var simulation = new Simulation(physicalWorld, display, parameters);

    parameters.bind(experiment.initialParameters, function() {
      simulation.run();
    });
    display.init();
    simulation.run();
  };

  host.Main = new Main();
})(this);

window.addEventListener("load", function() {
  Main.run();
});