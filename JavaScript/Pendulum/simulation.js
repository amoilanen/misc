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

    this.physicalWorld.set('alpha', this.parameters.evaluateAsRadial('alpha'));
    this.physicalWorld.set('beta', this.parameters.evaluate('beta'));

    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
    this.animationInterval = setInterval(function() {
      self.display.draw({
        'alpha': self.physicalWorld.measure('alpha'),
        'l': self.physicalWorld.measure('l'),
        'pendulumRadius': self.physicalWorld.measure('pendulumRadius')
      });
      self.physicalWorld.update();
    }, this.animationIntervalMs);
  };

  host.Simulation = Simulation;
})(this);