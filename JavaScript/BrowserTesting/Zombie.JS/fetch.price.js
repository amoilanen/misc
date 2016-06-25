var Browser = require("zombie");

var browser = new Browser();

var bookTitle = process.argv[2];

function isSearchFinished(document) {
  var noResultsTitle = document.querySelector('#noResultsTitle');
  var results = document.querySelectorAll('.s-result-item');

  console.log('Checking if the search has finished', !!noResultsTitle || (results.length > 0));
  return !!noResultsTitle || (results.length > 0);
}

function getBookInfo(document) {
  var noResultsTitle = document.querySelector('#noResultsTitle');

  if (noResultsTitle) {
    return;
  }

  var bookElement = browser.querySelector('.s-result-item');

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
browser.visit( "http://www.amazon.com", function() {
  browser.fill('#twotabsearchtextbox', bookTitle);
  browser.pressButton('input[value=Go]');

  browser.wait(function() {
    return isSearchFinished(browser.document);
  }, function() {
    browser.evaluate(function() {
      var bookInfo = getBookInfo(browser.document);

      if (!bookInfo) {
        console.log('No results found for "' + bookTitle + '\"');
      } else {
        console.log('Title = ' + bookInfo.title);
        console.log('Price = ' + bookInfo.price);
        console.log('Rating = ' + bookInfo.rating);
      }
    });
  });
});