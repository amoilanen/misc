(function(host) {

  var FFT_SIZE = 512;

  function processMicrophoneInput(onAudioCallback, onErrorCallback) {
    var context = new AudioContext();

    function connectToStream(stream) {
      var mediaStreamSource = context.createMediaStreamSource(stream);

      var processorNode = context.createScriptProcessor();
      processorNode.connect(context.destination);
      processorNode.onaudioprocess = function() {
        onAudioCallback(analyzer);
      };

      var analyzer = context.createAnalyser();
      analyzer.fftSize = FFT_SIZE;
      mediaStreamSource.connect(analyzer);
      analyzer.connect(processorNode);
      analyzer.connect(context.destination);
    }

    navigator.mediaDevices.getUserMedia({
      audio: true
    }).then(connectToStream).catch(onErrorCallback);
  };

  host.Audio = {
    processMicrophoneInput: processMicrophoneInput
  };
})(this);