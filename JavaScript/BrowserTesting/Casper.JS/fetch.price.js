/*
 * Running the script:
 *   node_modules/casperjs/bin/casperjs --web-security=no fetch.price.js JavaScript
 */

var casper = require('casper').create();
casper.start('http://amazon.com');

function isSearchFinished() {
  var noResultsTitle = document.querySelector('#noResultsTitle');
  var results = document.querySelectorAll('.s-result-item');

  return !!noResultsTitle || (results.length > 0);
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

var bookTitle = casper.cli.args[0];

casper.then(function() {
  console.log('Searching Amazon.com for "' + bookTitle + '"');
  this.sendKeys('#twotabsearchtextbox', bookTitle);
  this.mouse.click('input[value=Go]');
});

casper.waitFor(function check() {
  return this.evaluate(isSearchFinished);
}, function getFirstResult() {
  var bookInfo = this.evaluate(getBookInfo);

  if (!bookInfo) {
    console.log('No results found for "' + bookTitle + '\"');
  } else {
    console.log('Title = ', bookInfo.title);
    console.log('Price = ', bookInfo.price);
    console.log('Rating = ', bookInfo.rating);
  }
});

casper.run();