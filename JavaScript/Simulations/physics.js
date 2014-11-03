/*
 * Physical model and Physics laws for a pendulum.
 */
(function(host) {

  function PhysicalWorld() {
  }

  //Subclasses should implement this method
  PhysicalWorld.prototype.init = function() {
  };

  //Subclasses should implement this method
  PhysicalWorld.prototype.update = function() {
  };

  PhysicalWorld.prototype.updateParameters = function(parameters) {
    var self = this;

    parameters.getParameterNames().forEach(function(parameterName) {
      self.set(parameterName, parameters.evaluate(parameterName));
    });
  };

  PhysicalWorld.prototype.getVisibleFeatures = function() {
    var self = this;

    return this.visibleFeatureNames.reduce(function(features, featureName) {
      features[featureName] = self.measure(featureName);
      return features;
    }, {});
  };

  PhysicalWorld.prototype.measure = function(featureName) {
    return this[featureName];
  };

  PhysicalWorld.prototype.set = function(featureName, featureValue) {
    return this[featureName] = featureValue;
  };

  host.PhysicalWorld = PhysicalWorld;
})(this);