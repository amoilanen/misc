(function(host) {

  function Sensor(options) {
    this.measurementIntervalMs = options.measurementIntervalMs || 0;
    this.onVolumeMeasured = options.onVolumeMeasured || function() {};
    this.onSoundDetected = options.onSoundDetected || function() {};
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
    if (self.measurementIntervalMs > 0) {
      self.measurements.push(volumeValue);
      var currentMeasurementTime = new Date().getTime();
      if (currentMeasurementTime - self.lastMeasurementTime >= self.measurementIntervalMs) {
        var maxVolume = Math.max.apply(null, self.measurements);
        fireCallbacks(self, maxVolume);
        self.measurements = [];
        self.lastMeasurementTime = currentMeasurementTime;
      }
    } else {
      fireCallbacks(self, volumeValue);
    }
  }

  function fireCallbacks(self, volumeValue) {
    self.onVolumeMeasured(volumeValue);
    if (volumeValue > self.soundDetectionThreshold) {
      self.onSoundDetected(volumeValue);
    }
  }

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