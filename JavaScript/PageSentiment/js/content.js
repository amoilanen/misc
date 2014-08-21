var SENTIMENT_JSON_FILE = "../AFINN/afinn-111.json";

var MESSAGES = {
  SHOW: "show.sentiment",
  HIDE: "hide.sentiment",
  UNKNOWN: "unknown.message",
  DONE: "done"
};

var wordSentiment = {};
var domIntegration = null;

function init() {
  initListeners();
  getJson(SENTIMENT_JSON_FILE, function(sentimentData) {
    wordSentiment = sentimentData;
    domIntegration = new sentiment.DOMIntegration(wordSentiment, new sentiment.Analyzer());
  });
}

function initListeners() {
  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      switch(request.message) {
        case MESSAGES.SHOW:
          domIntegration.showSentiment();
          break;
        case MESSAGES.HIDE:
          domIntegration.hideSentiment();
          break;
        default:
          sendResponse(MESSAGES.UNKNOWN);
          break;
      };
      sendResponse(MESSAGES.DONE);
    }
  );
}

function getJson(file, callback) {
  var xhr = new XMLHttpRequest();

  xhr.onload = function(event) {
    callback && callback(JSON.parse(xhr.response));
  };
  xhr.open("GET", chrome.extension.getURL(file));
  xhr.send();
}

init();