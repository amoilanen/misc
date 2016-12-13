(function(host) {

  function Sensor(listeners) {
    this.listeners = listeners;
    if (!this.listeners.onVolume) {
      this.listeners.onVolume = function() {};
    }
    if (!this.listeners.onMaxAverageVolume) {
      this.listeners.onMaxAverageVolume = function() {};
    }
    this.lastMeasurementTime = null;
    this.measurementIntervalMs = 5000;
    this.soundDetectionThreshold = 0.1; //TODO: Should be configurable
    this.measurements = [];
  }

  function getVolume(self, analyzer) {
    var frequencyValues = new Uint8Array(analyzer.frequencyBinCount);

    analyzer.getByteFrequencyData(frequencyValues);
    return Array.from(frequencyValues).reduce(function(acc, value) {
      return acc + value / frequencyValues.length;
    }, 0) / frequencyValues.length;
  }

  function recordValue(self, volumeValue) {
    self.measurements.push(volumeValue);
    var currentMeasurementTime = new Date().getTime();
    if (currentMeasurementTime - self.lastMeasurementTime >= self.measurementIntervalMs) {
      var maxVolume = Math.max.apply(null, self.measurements);
      self.listeners.onMaxAverageVolume({
        volume: maxVolume,
        threshold: self.soundDetectionThreshold
      });
      self.measurements = [];
      self.lastMeasurementTime = currentMeasurementTime;
    }
  }

  Sensor.prototype.listen = function() {
    var self = this;

    this.lastMeasurementTime = new Date().getTime();
    Audio.processMicrophoneInput(function(analyzer) {
      var volumeValue = getVolume(self, analyzer);

      recordValue(self, volumeValue);
      self.listeners.onVolume({
        volume: volumeValue,
        threshold: self.soundDetectionThreshold
      });
    }, function error(e) {
      var errorMessageNode = document.createTextNode(
        'Error while trying to listen to the microphone...' + JSON.stringify(e)
      );
      document.body.appendChild(errorMessageNode);
    });
    return this;
  };

  host.Sensor = Sensor;
})(this);