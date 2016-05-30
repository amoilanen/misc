var DEFAULT_CHECK_INTERVAL_MS = 100;

var page = require('webpage').create();

function open(page, url) {
  return new Promise(function(resolve, reject) {
    page.open(url, function(status) {
      if (status === 'success') {
        resolve(status);
      } else {
        reject(status);
      }
    })
  });
}

function waitFor(condition, checkInterval) {
  checkInterval = checkInterval || DEFAULT_CHECK_INTERVAL_MS;
  return new Promise(function(resolve, reject) {
    setTimeout(function check() {
      if (condition()) {
        resolve();
      } else {
        setTimeout(check, checkInterval);
      }
    }, checkInterval);
  });
}

page.onConsoleMessage = function(msg) {
  console.log(msg);
};