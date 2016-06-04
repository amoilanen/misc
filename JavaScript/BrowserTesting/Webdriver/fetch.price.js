/*
 * Demo of using Webdriver to automate browser testing.
 * Fetches price and rating for a book from Amazon.com for a given book title.
 *
 * Example:
 *
 * node fetch.price.js SurviveJS
 */

var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;

var TIMEOUT_MS = 5000;

var bookTitle = process.argv[2];

var driver = new webdriver.Builder()
    .forBrowser('firefox')
    .build();

console.log('Searching Amazon.com for "' + bookTitle + '"');

driver.get('http://amazon.com');

driver.wait(until.elementLocated(By.id('twotabsearchtextbox')), TIMEOUT_MS);
driver.findElement(By.id('twotabsearchtextbox')).sendKeys(bookTitle);
driver.findElement(By.css('input[value=Go]')).click();

driver.wait(until.elementLocated(By.id('atfResults')), TIMEOUT_MS).then(function() {
  var firstResult = driver.findElement(By.css('.s-result-item'));

  var bookDetails = {
    title: firstResult.findElement(By.css('.s-access-title')),
    price: firstResult.findElement(By.css('.a-color-price')),
    rating: firstResult.findElement(By.css('.a-icon-star .a-icon-alt'))
  };

  ['title', 'price', 'rating'].forEach(function(bookField) {
    bookDetails[bookField].getAttribute('innerHTML').then(function(text) {
      console.log(bookField + ' = ', text);
    });
  });
}).catch(function() {
  console.log('No results found for "' + bookTitle + '\"');
}).finally(function() {
  driver.quit();
});