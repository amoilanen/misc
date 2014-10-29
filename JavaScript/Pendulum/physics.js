/*
 * Physical model and Physics laws for a pendulum.
 */
(function(host) {

  function PhysicalWorld() {

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
  }

  PhysicalWorld.prototype.update = function() {
    this.omega = this.omega + (-(this.g * Math.sin(this.alpha)) / this.l
                                   - (this.beta * this.l * this.omega) / this.m) * this.deltaT;
    this.alpha = this.alpha + this.omega * this.deltaT;
  };

  PhysicalWorld.prototype.measure = function(featureName) {
    return this[featureName];
  };

  PhysicalWorld.prototype.set = function(featureName, featureValue) {
    return this[featureName] = featureValue;
  };

  host.PhysicalWorld = PhysicalWorld;
})(this);