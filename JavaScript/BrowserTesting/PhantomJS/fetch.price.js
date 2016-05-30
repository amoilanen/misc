'use strict';

phantom.injectJs('bower_components/es6-promise/promise.min.js');
phantom.injectJs('bower_components/bind-polyfill/index.js');
phantom.injectJs('phantom/page.js');
phantom.injectJs('amazon/home.js');
phantom.injectJs('amazon/search.js');

var bookTitle = 'Let over Lambda';

//TODO: Case when the book does not exist should also be handled

var homePage = new HomePage(page);

console.log('Searching Amazon.com for "' + bookTitle + '"');
homePage.open().then(function(status) {
  var searchPage = homePage.searchFor(bookTitle);

  return searchPage.waitForResults().then(function() {
    var foundBook = searchPage.getFirstResult();

    console.log('Title = ', foundBook.title);
    console.log('Price = ', foundBook.price);
    console.log('Rating = ', foundBook.rating);
  });
})
.then(function() {
  phantom.exit(0);
}).catch(function(err) {
  phantom.exit(1);
});