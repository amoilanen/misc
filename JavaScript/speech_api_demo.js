//Based on the demo https://gist.github.com/wesbos/cd16b8b1815825f111a2
(function(host) {

  if (typeof speechSynthesis === 'undefined') {
    console.warn('No speech syntesis feature available,'
      + 'calls to "say" will be ignored, try latest Google Chrome');
    host.say = function() {};
    return;
  }

  var messageQueue = [];
  var defaultVoiceName = 'Google US English';

  function say(message, voiceName) {
    if (areVoicesLoaded()) {
      doSay(message, voiceName);
    } else {
      messageQueue.push({
        message: message,
        voiceName: voiceName
      });
    }
  }

  function areVoicesLoaded() {
    return speechSynthesis.getVoices().length > 0;
  }

  function doSay(message, voiceName) {
    var utterance = new SpeechSynthesisUtterance();
    voiceName = voiceName || defaultVoiceName;

    utterance.voice = speechSynthesis.getVoices().find(voice => voice.name == voiceName);
    utterance.text = message;
    speechSynthesis.speak(utterance);
  }

  speechSynthesis.onvoiceschanged = function() {
    messageQueue.forEach(queueItem => doSay(queueItem.message, queueItem.voiceName));
    messageQueue = [];
  };

  host.say = say;
})(this);

//Demo
say('JavaScript apps can talk in Google Chrome');
say('JavaScript aplicaciones pueden hablar en Google Chrome', 'Google español');
say('JavaScript-apps kunnen spreken in Google Chrome', 'Google Nederlands');