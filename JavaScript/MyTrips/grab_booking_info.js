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

function waitFor(page, condition, callback, errback) {
  var timeWaited = 0;

  function check() {
    if (timeWaited > MAX_WAIT_TIME_MS) {
      errback && errback(new Error("Timed out waiting for condition " + condition.toString()));
    }
    if (condition(page)) {
      callback();
    } else {
      timeWaited += CHECK_INTERVAL_MS;
      setTimeout(check, CHECK_INTERVAL_MS);
    }
  }

  check();
}

function whenElementAvailable(page, cssSelector, callback, errback) {
  waitFor(page, function(page) {
    return page.evaluate(function(cssSelector) {
      return document.querySelector(cssSelector) != null;
    }, cssSelector);
  }, callback, errback);
}

function whenUrlChanges(page, callback, errback) {

  function getUrl(page) {
    return page.evaluate(function() {
      return document.URL;
    });
  }

  var initialUrl = getUrl(page);

  waitFor(page, function(page) {
    var currentUrl = getUrl(page);

    return currentUrl != initialUrl;
  }, callback, errback);
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

function waitElement(page, cssSelector) {
   return new Promise(function(resolve, reject) {
     whenElementAvailable(page, cssSelector, function() {
       resolve(cssSelector);
     }, function(error) {
       reject(error);
     });
   });
}

function waitUrlChange(page) {
   return new Promise(function(resolve, reject) {
     whenUrlChanges(page, function() {
       resolve();
     }, function(error) {
       reject(error);
     });
   });
}

function delay(milliseconds) {
  milliseconds = milliseconds || 0;
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      resolve();
    }, milliseconds);
  });
};

/*
 * Functions for interacting with GMail
 */

//TODO: Make this into a "class" to which page can be provided as a dependency
var gmail = {
  login: function(email, password) {
    return open(page, 'https://accounts.google.com').then(function() {
      this.page.evaluate(function(email, password) {
        var emailInput = document.querySelector("#Email");
        var passwordInput = document.querySelector("#Passwd");
        var signInButton = document.querySelector("#signIn");

        emailInput.setAttribute("value", email);
        passwordInput.setAttribute("value", password);

        signInButton.click();
      }, email, password);

      return waitElement(this.page, "#nav-personalinfo");
    });
  },
  openInbox: function() {
    return open(this.page, 'https://mail.google.com').then(function() {
      return waitElement(page, "button[aria-label]");
    });
  },
  emailCount: function(senderEmail) {
    return page.evaluate(function(senderEmail) {
      var emails = document.querySelectorAll("td > div:nth-child(2) > span[email=\"" + senderEmail + "\"]");

      return emails.length;
    }, senderEmail);
  },
  searchForTerm: function(term) {
    this.page.evaluate(function(term) {
      var searchInputs = [].slice.call(document.querySelectorAll("form input"));
      var searchButton = document.querySelector("form button");

      searchInputs.forEach(function(input) {
        input.value = term;
      });
      searchButton.click();
    }, term);

    return waitUrlChange(page);
  }
};
gmail.page = page;

/*
 * Script that grabs the booking info from gmail.
 */
gmail.login(email, password).then(function() {
  return gmail.openInbox();
}).then(function() {
  return gmail.searchForTerm('customer.service@booking.com');
}).then(function() {

  page.render('search_results.png');

  var emailCount = gmail.emailCount('customer.service@booking.com');

  //for (var i = 0; i < emailCount; i++) {
    var emailIndex = 0;

    return new Promise(function(resolve, reject) {

      //TODO: Extract the function that does the actual e-mail selection
      page.evaluate(function(emailIndex) {
        var emails = document.querySelectorAll("td > div:nth-child(2) > span[name=\"Booking.com\"]");
        var event = document.createEvent("MouseEvent");

        event.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        emails[emailIndex].dispatchEvent(event);
      }, emailIndex);
      resolve();
    }).then(function() {
      return waitUrlChange(page);
    }).then(function() {

      //TODO: Extract the function that extracts the booking info
      var booking = page.evaluate(function() {

        function getContent(domElement) {
          return domElement.innerHTML.replace(/<.*?>/g, "").replace(/\n/g, " ");
        }

        var hotelLink = document.querySelector("a[title=Hotelinformatie]");
        var hotel = getContent(hotelLink);

        var details = [].slice.call(document.querySelectorAll("td[style=\"text-align:right;font-family:arial;color:#333;font-size:12px;line-height:17px;border-bottom:1px dotted #aaaaaa;padding-top:5px;padding-bottom:5px\"]")).slice(0, 3).map(function(domElement) {
          return getContent(domElement);
        });

        var priceElement = document.querySelector("td[style=\"text-align:right;font-size:16px;line-height:21px;font-family:arial;color:#333;padding-top:5px;color:#003580;padding-left:5px\"]");
        var price = getContent(priceElement);

        return {
          hotel: hotel,
          stay: details[0],
          startDate: details[1],
          endDate: details[2],
          price: price
        };
      });

      console.log("booking = ", JSON.stringify(booking));

      page.render('single_email.png');

      page.evaluate(function() {
        window.history.back();
      });
      return waitUrlChange(page);
    }).then(function() {
      //TODO: Here navigate back
      console.log("In total " + emailCount + " e-mails on the page");

      page.render('back.png');

      phantom.exit();
    });
  //}

  //TODO: Open each e-mail on the current page
  //TODO: Analyze the content of such an email

  //TODO: Open next page
  //If no em-mails finish
  //If there are e-mails, repeat
});

//TODO: Iterate over all the e-mails that matched and extract the Booking information:
//city, address, start date, end date. Output this information to the console
//TODO: Re-factoring: extract common code that can be re-used in other PhantomJS scripts
//Looks a lot like what Selenium does, but this is closer to JavaScript being executed on the page (more low-level) and gives more control over execution. May still be useful when we want to run some test spec against
//a certain state of a certain page of a production app