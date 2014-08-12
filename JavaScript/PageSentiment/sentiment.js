var isActive = false;

function toggle() {
  isActive = !isActive;
  renderExtensionAction();

  //TODO: Do the actual highlighting and analysis here
}

function renderExtensionAction() {
  var title = isActive ? "Hide sentiment" : "Show sentiment";
  var badgeText = isActive ? "on" : "off";

  chrome.browserAction.setTitle({title: title});
  chrome.browserAction.setBadgeText({text: badgeText});
}

function init() {
  chrome.browserAction.onClicked.addListener(toggle);
  renderExtensionAction();
}

init();