/*
 * Script that grabs Booking.com booking info from Gmail.
 */
var CHECK_INTERVAL_MS = 1000;
var MAX_WAIT_TIME_MS = 10000;

var email = "<username>@gmail.com";
var password = "<password>";

var page = require('webpage').create();

page.viewportSize = {
  width: 1024,
  height: 768
};

function whenElementAvailable(page, selector, callback) {

  var timeWaited = 0;

  function check() {
    if (timeWaited > MAX_WAIT_TIME_MS) {
      throw new Error("Timed out waiting for '" + selector + "'");
    }

    var isAvailable = page.evaluate(function(selector) {
      return document.querySelector(selector) != null;
    }, selector);

    if (isAvailable) {
      callback();
    } else {
      timeWaited += CHECK_INTERVAL_MS;
      setTimeout(check, CHECK_INTERVAL_MS);
    }
  }

  check();
}

page.open('https://accounts.google.com', function(status) {
  page.evaluate(function(email, password) {
    var emailInput = document.querySelector("#Email");
    var passwordInput = document.querySelector("#Passwd");
    var signInButton = document.querySelector("#signIn");

    emailInput.setAttribute("value", email);
    passwordInput.setAttribute("value", password);

    signInButton.click();
  }, email, password);

  //Wait for login to finish
  whenElementAvailable(page, "#nav-personalinfo", function() {
    page.render('mail.png');
    //TODO: Open the mail page https://mail.google.com
    //TODO: Search for customer.service@booking.com
    //TODO: Iterate over all the e-mails that matched and extract the Booking information:
    //city, address, start date, end date
    phantom.exit();
  });
});