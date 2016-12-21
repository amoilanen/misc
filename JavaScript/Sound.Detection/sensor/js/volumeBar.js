(function(host) {

  var DEFAULT_SOUND_DETECTION_THRESHOLD = 0.1;

  var CANVAS_WIDTH = 250;
  var CANVAS_HEIGHT = 200;
  var MARGIN = 20;
  var BAR_WIDTH = 60;
  var BAR_HEIGHT = 200;
  var NORMAL_COLOR = '#DCDCDC';
  var SOUND_DETECTED_COLOR = '#696969';

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
    initializeThresholdInput(this);
    initializeBarCanvas(this);
    return this;
  };

  function initializeThresholdInput(self) {
    var thresholdLabel = document.createElement('label');
    thresholdLabel.setAttribute('for', 'threshold');
    var labelText = document.createTextNode('Sound detection threshold (percent)');
    thresholdLabel.appendChild(labelText);
    self.container.appendChild(thresholdLabel);

    var thresholdInput = document.createElement('input');
    thresholdInput.setAttribute('name', 'threshold');
    thresholdInput.setAttribute('value', '10');
    thresholdInput.addEventListener('keyup', function(event) {
      var thresholdValuePercent = event.target.value;
      var thresholdValue = thresholdValuePercent / 100;

      self.setSoundDetectionThreshold(thresholdValue);
    });
    self.container.appendChild(thresholdInput);
  }

  function initializeBarCanvas(self) {
    var canvas = document.createElement('canvas');

    canvas.setAttribute('width', CANVAS_WIDTH + 'px');
    canvas.setAttribute('height', CANVAS_HEIGHT + 'px');
    self.context = canvas.getContext('2d');
    self.container.appendChild(canvas);
  }

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
    eraseCanvas(this);

    var volumeBarColor = NORMAL_COLOR;
    if (this.volume > this.soundDetectionThreshold) {
      volumeBarColor = SOUND_DETECTED_COLOR;
    }
    renderVolumeBar(this, volumeBarColor);

    var volumeInPercent = (this.volume * 100).toFixed(0);
    renderVolumePercentLabel(this, volumeInPercent);

    if (this.volume > this.soundDetectionThreshold) {
      renderSoundDetectedLabel(this);
    }
    return this;
  };

  function eraseCanvas(self) {
    self.context.fillStyle = '#fff';
    self.context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  function renderVolumeBar(self, volumeBarColor) {
    self.context.fillStyle = volumeBarColor;
    self.context.fillRect(0, 0, BAR_WIDTH, BAR_HEIGHT);
    self.context.fillStyle = '#fff';
    self.context.fillRect(0, 0, BAR_WIDTH, BAR_HEIGHT - self.volume * BAR_HEIGHT);
    self.context.rect(0, 0, BAR_WIDTH, BAR_HEIGHT);
    self.context.stroke();
  }

  function renderVolumePercentLabel(self, volumePercent) {
    self.context.fillStyle = 'black';
    self.context.font = '12px serif';
    self.context.fillText(volumePercent + '%', MARGIN, BAR_HEIGHT - MARGIN);
    self.context.fillText('Volume level (percent)', BAR_WIDTH + MARGIN, MARGIN);
  }

  function renderSoundDetectedLabel(self) {
    self.context.fillText('Sound detected!', BAR_WIDTH + MARGIN, 2 * MARGIN);
  }

  host.VolumeBar = VolumeBar;
})(this);