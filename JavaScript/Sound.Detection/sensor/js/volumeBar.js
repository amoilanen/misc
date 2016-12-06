(function(host) {

  function VolumeBar(container, width, height) {
    this.context = null;
    this.container = container;
    this.width = width;
    this.height = height;
    this.volume = 0;
  }

  VolumeBar.prototype.init = function() {
    this.container.setAttribute('width', this.width + 'px');
    this.container.setAttribute('height', this.height + 'px');
    this.context = this.container.getContext('2d');
    return this;
  };

  VolumeBar.prototype.setVolume = function(volume) {
    this.volume = volume;
    return this;
  };

  VolumeBar.prototype.render = function() {
    var volumeInPercent = (this.volume * 100).toFixed(0);
    var volumeValueMargin = this.width / 3;

    this.context.fillStyle = '#fff';
    this.context.fillRect(0, 0, this.width, this.height);
    this.context.fillStyle = '#90949c';
    this.context.fillRect(0, this.height - this.volume * this.height, this.width, this.height);
    this.context.fillStyle = 'black';
    this.context.font = '12px serif';
    this.context.fillText(volumeInPercent + '%', volumeValueMargin, this.height - volumeValueMargin);
    this.context.rect(0, 0, this.width, this.height);
    this.context.stroke();
    return this;
  };

  host.VolumeBar = VolumeBar;
})(this);