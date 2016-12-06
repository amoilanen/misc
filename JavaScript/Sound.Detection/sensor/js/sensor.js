(function(host) {

  function Sensor() {
  }

  Sensor.prototype.listen = function(onCurrentVolumeLevelCallback) {
    Audio.processMicrophoneInput(function(analyzer) {
      var frequencyValues = new Uint8Array(analyzer.frequencyBinCount);
      analyzer.getByteFrequencyData(frequencyValues);

      var averageFrequencyValue = Array.from(frequencyValues).reduce(function(acc, value) {
        return acc + value / frequencyValues.length;
      }, 0) / frequencyValues.length;

      var volumeValue = averageFrequencyValue;
      onCurrentVolumeLevelCallback(volumeValue);
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