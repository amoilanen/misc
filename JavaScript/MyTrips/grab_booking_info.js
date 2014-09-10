phantom.injectJs('bower_components/es6-promise/promise.min.js');

/*
 * Script that grabs Booking.com booking info from Gmail.
 */
var CHECK_INTERVAL_MS = 1000;
var MAX_WAIT_TIME_MS = 5000;

var email = "<username>@gmail.com";
var password = "<password>";

var page = require('webpage').create();

page.viewportSize = {
  width: 1024,
  height: 768
};

function whenElementAvailable(page, cssSelector, callback, errback) {

  var timeWaited = 0;

  function check() {
    if (timeWaited > MAX_WAIT_TIME_MS) {
      errback && errback(new Error("Timed out waiting for '" + cssSelector + "'"));
    }

    var isAvailable = page.evaluate(function(cssSelector) {
      return document.querySelector(cssSelector) != null;
    }, cssSelector);

    if (isAvailable) {
      callback();
    } else {
      timeWaited += CHECK_INTERVAL_MS;
      setTimeout(check, CHECK_INTERVAL_MS);
    }
  }

  check();
}

//TODO: Make into methods on the created page
//TODO: Extract as a separate library, publish it to Bower?

function open(page, url) {

  //TODO: Error handling
  return new Promise(function(resolve, reject) {
    page.open(url, function(status) {
      resolve(status);
    });
  });
}

function waitFor(page, cssSelector) {
   return new Promise(function(resolve, reject) {
     whenElementAvailable(page, cssSelector, function() {
       resolve(cssSelector);
     }, function(error) {
       reject(error);
     });
   });
};

function delay(milliseconds) {
  milliseconds = milliseconds || 0;
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      resolve();
    }, milliseconds);
  });
};

open(page, 'https://accounts.google.com').then(function() {
  page.evaluate(function(email, password) {
    var emailInput = document.querySelector("#Email");
    var passwordInput = document.querySelector("#Passwd");
    var signInButton = document.querySelector("#signIn");

    emailInput.setAttribute("value", email);
    passwordInput.setAttribute("value", password);

    signInButton.click();
  }, email, password);

  return waitFor(page, "#nav-personalinfo");
}).then(function() {
  return open(page, 'https://mail.google.com');
}).then(function() {
  return waitFor(page, "button[aria-label]");
}).then(function() {

  //Searching for e-mails from "customer.service@booking.com"
  page.evaluate(function() {
    var searchInputs = [].slice.call(document.querySelectorAll("form input"));
    var searchButton = document.querySelector("form button");

    searchInputs.forEach(function(input) {
      input.value = "customer.service@booking.com";
    });
    searchButton.click();
  });

  /*
   * No easily identifiable elements on the page.
   * Besides the span.v1 message but this is a generated class name => fragile.
   */
  return delay(2000);
  //TODO: Wait for the url change, it is a good indication
}).then(function() {
  page.render('mail.png');
  phantom.exit();
});

//TODO: Iterate over all the e-mails that matched and extract the Booking information:
//city, address, start date, end date. Output this information to the console
//TODO: Re-factoring: extract common code that can be re-used in other PhantomJS scripts