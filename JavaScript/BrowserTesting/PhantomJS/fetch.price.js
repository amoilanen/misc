'use strict';

var page = require('webpage').create();

var bookTitle = 'Let over Lambda';

page.onConsoleMessage = function(msg) {
  console.log(msg);
};

//TODO: Case when the book does not exist should also be handled

    function isBookFound() {
      return page.evaluate(function() {
        var results = document.querySelectorAll('.s-result-item');

        return results.length > 0;
      });
    }

console.log('Searching Amazon.com for "' + bookTitle + '"');
page.open('http://www.amazon.com/', function(status) {
  if (status === 'success') {
    page.evaluate(function(bookTitle) {
      var searchBox = document.querySelector('#twotabsearchtextbox');

      searchBox.value = bookTitle;

      var searchButton = document.querySelector('input[value=Go]');

      searchButton.click();
    }, bookTitle);

    setTimeout(function checkForResults() {
      if (isBookFound()) {
        page.evaluate(function() {
          var bookElement = document.querySelector('.s-result-item');

          var title = bookElement.querySelector('.s-access-title').innerHTML;
          var price = bookElement.querySelector('.a-color-price').innerHTML;
          var rating = bookElement.querySelector('.a-icon-star .a-icon-alt').innerHTML;

          console.log('Title = ', title);
          console.log('Price = ', price);
          console.log('Rating = ', rating);
        });
        phantom.exit(0);
      } else {
        setTimeout(checkForResults, 100);
      }
    }, 100);
  } else {
    phantom.exit(1);
  }
});