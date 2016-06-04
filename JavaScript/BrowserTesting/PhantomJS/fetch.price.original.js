'use strict';

var page = require('webpage').create();
var args = require('system').args;

var bookTitle = args[1];

page.onConsoleMessage = function(msg) {
  console.log(msg);
};

function isSearchFinished() {
  return page.evaluate(function() {
    var noResultsTitle = document.querySelector('#noResultsTitle');
    var results = document.querySelectorAll('.s-result-item');

    return !!noResultsTitle || (results.length > 0);
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
      if (isSearchFinished()) {
        page.evaluate(function(bookTitle) {
          var noResultsTitle = document.querySelector('#noResultsTitle');

          if (noResultsTitle) {
            console.log('No results found for "' + bookTitle + '\"');
            return;
          }

          var bookElement = document.querySelector('.s-result-item');

          var title = bookElement.querySelector('.s-access-title').innerHTML;
          var price = bookElement.querySelector('.a-color-price').innerHTML;
          var rating = bookElement.querySelector('.a-icon-star .a-icon-alt').innerHTML;

          console.log('Title = ', title);
          console.log('Price = ', price);
          console.log('Rating = ', rating);
        }, bookTitle);
        phantom.exit(0);
      } else {
        setTimeout(checkForResults, 100);
      }
    }, 100);
  } else {
    phantom.exit(1);
  }
});