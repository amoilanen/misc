/*
 * phantomjs fetch.price.original.js "\"Let over Lambda\""
 */

'use strict';

var page = require('webpage').create();
var args = require('system').args;

var bookTitle = args[1];

page.onConsoleMessage = function(msg) {
  console.log(msg);
};

function searchByTerm(term) {
  var searchBox = document.querySelector('#twotabsearchtextbox');

  searchBox.value = term;

  var searchButton = document.querySelector('input[value=Go]');

  searchButton.click();
}

function isSearchFinished() {
  return page.evaluate(function() {
    var noResultsTitle = document.querySelector('#noResultsTitle');
    var results = document.querySelectorAll('.s-result-item');

    return !!noResultsTitle || (results.length > 0);
  });
}

function getBookInfo() {
  var noResultsTitle = document.querySelector('#noResultsTitle');

  if (noResultsTitle) {
    return;
  }

  var bookElement = document.querySelector('.s-result-item');

  var title = bookElement.querySelector('.s-access-title').innerHTML;
  var price = bookElement.querySelector('.a-color-price').innerHTML;
  var rating = bookElement.querySelector('.a-icon-star .a-icon-alt').innerHTML;

  return {
    title: title,
    price: price,
    rating: rating
  };
}

console.log('Searching Amazon.com for "' + bookTitle + '"');
page.open('http://www.amazon.com/', function(status) {
  if (status === 'success') {
    page.evaluate(searchByTerm, bookTitle);

    setTimeout(function checkForResults() {
      if (isSearchFinished()) {
        var bookInfo = page.evaluate(getBookInfo);

        if (!bookInfo) {
          console.log('No results found for "' + bookTitle + '\"');
        } else {
          console.log('Title = ', bookInfo.title);
          console.log('Price = ', bookInfo.price);
          console.log('Rating = ', bookInfo.rating);
        }
        phantom.exit(0);
      } else {
        setTimeout(checkForResults, 100);
      }
    }, 100);
  } else {
    phantom.exit(1);
  }
});