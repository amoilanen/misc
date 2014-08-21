var isActive = false;

function toggle() {
  isActive = !isActive;
  renderExtensionAction();
  sendMessage(isActive ? "show.sentiment" : "hide.sentiment");
}

function renderExtensionAction() {
  var title = isActive ? "Hide sentiment" : "Show sentiment";
  var badgeText = isActive ? "on" : "off";

  chrome.browserAction.setTitle({title: title});
  chrome.browserAction.setBadgeText({text: badgeText});
}

function sendMessage(msg, responseCallback) {
  responseCallback = responseCallback || function(response) {};
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {message: msg}, responseCallback);
  });
}

function init() {
  chrome.browserAction.onClicked.addListener(toggle);
  renderExtensionAction();
}

init();