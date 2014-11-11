/*
 * Simulation of the parameterizable physical world that is being displayed.
 */
(function(host) {

  function Simulation(physicalWorld, display, parameters) {
    this.physicalWorld = physicalWorld;
    this.display = display;
    this.parameters = parameters;
    this.animationIntervalMs = 20;
    this.animationInterval = null;
  }

  Simulation.prototype.run = function() {
    var self = this;

    this.display.clear();
    this.physicalWorld.updateParameters(this.parameters);
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
    this.animationInterval = setInterval(function() {
      self.display.draw(self.physicalWorld);
      self.physicalWorld.update();
    }, this.animationIntervalMs);
  };

  host.Simulation = Simulation;
})(this);