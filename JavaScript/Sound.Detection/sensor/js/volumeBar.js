(function(host) {

  var DEFAULT_SOUND_DETECTION_THRESHOLD = 0.1;

  var canvasWidth = 250;
  var canvasHeight = 200;
  var margin = 20;

  function VolumeBar(container, listeners) {
    this.context = null;
    this.container = container;
    this.volume = 0;
    this.listeners = listeners  || {};
    if (!this.listeners.onSoundDetectionThresholdChange) {
      this.listeners.onSoundDetectionThresholdChange = function() {};
    }
    this.setSoundDetectionThreshold(DEFAULT_SOUND_DETECTION_THRESHOLD);
  }

  VolumeBar.prototype.init = function() {
    var self = this;

    var thresholdLabel = document.createElement('label');
    thresholdLabel.setAttribute('for', 'threshold');
    var labelText = document.createTextNode('Sound detection threshold (percent)');
    thresholdLabel.appendChild(labelText);
    this.container.appendChild(thresholdLabel);
    var thresholdInput = document.createElement('input');
    thresholdInput.setAttribute('name', 'threshold');
    thresholdInput.setAttribute('value', '10');
    thresholdInput.addEventListener('keyup', function(event) {
      var thresholdValuePercent = event.target.value;
      var thresholdValue = thresholdValuePercent / 100;

      self.setSoundDetectionThreshold(thresholdValue);
    });
    this.container.appendChild(thresholdInput);

    var canvas = document.createElement('canvas');
    this.container.appendChild(canvas);
    canvas.setAttribute('width', canvasWidth + 'px');
    canvas.setAttribute('height', canvasHeight + 'px');
    this.context = canvas.getContext('2d');

    return this;
  };

  VolumeBar.prototype.setVolume = function(volume) {
    this.volume = volume;
    return this;
  };

  VolumeBar.prototype.setSoundDetectionThreshold = function(soundDetectionThreshold) {
    this.soundDetectionThreshold = soundDetectionThreshold;
    this.listeners.onSoundDetectionThresholdChange(soundDetectionThreshold);
    return this;
  };

  VolumeBar.prototype.render = function() {
    var barWidth = 60;
    var barHeight = 200;

    var volumeInPercent = (this.volume * 100).toFixed(0);

    this.context.fillStyle = '#fff';
    this.context.fillRect(0, 0, canvasWidth, canvasHeight);
    if (this.volume > this.soundDetectionThreshold) {
      this.context.fillStyle = '#696969';
    } else {
      this.context.fillStyle = '#DCDCDC';
    }
    this.context.fillRect(0, 0, barWidth, barHeight);
    this.context.fillStyle = '#fff';
    this.context.fillRect(0, 0, barWidth, barHeight - this.volume * barHeight);

    this.context.fillStyle = 'black';
    this.context.font = '12px serif';
    this.context.fillText(volumeInPercent + '%', margin, barHeight - margin);
    this.context.fillText('Volume level (percent)', barWidth + margin, margin);
    if (this.volume > this.soundDetectionThreshold) {
      this.context.fillText('Sound detected!', barWidth + margin, 2 * margin);
    }
    this.context.rect(0, 0, barWidth, barHeight);
    this.context.stroke();
    return this;
  };

  host.VolumeBar = VolumeBar;
})(this);