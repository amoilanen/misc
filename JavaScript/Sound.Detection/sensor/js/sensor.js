(function(host) {

  function Sensor(listeners) {
    this.listeners = listeners;
    if (!this.listeners.onVolumeMeasured) {
      this.listeners.onVolumeMeasured = function() {};
    }
    if (!this.listeners.onAverageVolumeMeasured) {
      this.listeners.onAverageVolumeMeasured = function() {};
    }
    if (!this.listeners.onSoundDetected) {
      this.listeners.onSoundDetected = function() {};
    }
    this.lastMeasurementTime = null;
    this.measurements = [];
  }

  function getVolume(self, analyzer) {
    var frequencyValues = new Uint8Array(analyzer.frequencyBinCount);

    analyzer.getByteFrequencyData(frequencyValues);
    return Array.from(frequencyValues).reduce(function(acc, value) {
      return acc + value / frequencyValues.length;
    }, 0) / frequencyValues.length;
  }

  function measureVolumeValue(self, volumeValue) {
    self.listeners.onVolumeMeasured(volumeValue);

    if (volumeValue > self.soundDetectionThreshold) {
      self.listeners.onSoundDetected(volumeValue);
    }

    if (!self.averageMeasurementIntervalMs) {
      return;
    }
    self.measurements.push(volumeValue);
    var currentMeasurementTime = new Date().getTime();
    if (currentMeasurementTime - self.lastMeasurementTime >= self.measurementIntervalMs) {
      var maxVolume = Math.max.apply(null, self.measurements);
      self.listeners.onAverageVolumeMeasured({
        volume: maxVolume,
        threshold: self.soundDetectionThreshold
      });
      self.measurements = [];
      self.lastMeasurementTime = currentMeasurementTime;
    }
  }

  Sensor.prototype.setAverageMeasurementIntervalMs = function(averageMeasurementIntervalMs) {
    this.averageMeasurementIntervalMs = averageMeasurementIntervalMs;
    return this;
  };

  Sensor.prototype.setSoundDetectionThreshold = function(soundDetectionThreshold) {
    this.soundDetectionThreshold = soundDetectionThreshold;
    return this;
  };

  Sensor.prototype.listen = function() {
    var self = this;

    this.lastMeasurementTime = new Date().getTime();
    Audio.processMicrophoneInput(function(analyzer) {
      var volumeValue = getVolume(self, analyzer);

      measureVolumeValue(self, volumeValue);
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