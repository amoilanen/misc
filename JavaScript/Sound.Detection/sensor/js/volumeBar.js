(function(host) {

  var canvasWidth = 200;
  var canvasHeight = 200;
  var margin = 20;

  function VolumeBar(container, options) {
    this.context = null;
    this.container = container;
    this.volume = 0;
    this.detectionLimit = 0.1;
  }

  VolumeBar.prototype.init = function() {
    var self = this;

    var limitLabel = document.createElement('label');
    limitLabel.setAttribute('for', 'limit');
    var labelText = document.createTextNode('Detection limit (percent)');
    limitLabel.appendChild(labelText);
    this.container.appendChild(limitLabel);
    var limitInput = document.createElement('input');
    limitInput.setAttribute('name', 'limit');
    limitInput.setAttribute('value', '10');
    limitInput.addEventListener('keyup', function(event) {
      var limitValuePercent = event.target.value;
      var limitValue = limitValuePercent / 100;

      self.setDetectionLimit(limitValue);
    });
    this.container.appendChild(limitInput);

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

  VolumeBar.prototype.setDetectionLimit = function(detectionLimit) {
    console.log('Setting detection limit: ', detectionLimit);
    this.detectionLimit = detectionLimit;
    return this;
  };

  VolumeBar.prototype.render = function() {
    var barWidth = 60;
    var barHeight = 200;

    var volumeInPercent = (this.volume * 100).toFixed(0);

    this.context.fillStyle = '#fff';
    this.context.fillRect(0, 0, canvasWidth, canvasHeight);
    if (this.volume > this.detectionLimit) {
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
    if (this.volume > this.detectionLimit) {
      this.context.fillText('Sound detected!', barWidth + margin, 2 * margin);
    }
    this.context.rect(0, 0, barWidth, barHeight);
    this.context.stroke();
    return this;
  };

  host.VolumeBar = VolumeBar;
})(this);