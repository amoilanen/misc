/*
 * Running the script:
 *   dalek fetch.price.js JavaScript
 */

var bookTitle = process.argv[3];

console.log('Searching Amazon.com for "' + bookTitle + '"');
module.exports = {
  'Fetch price from Amazon': function(test) {
    test
      .open('http://amazon.com')
      .type('#twotabsearchtextbox', bookTitle)
      .click('input[value=Go]')
      .waitForElement('.s-result-item', 'There are results')
      .screenshot('search.results.png')
      .done();
  }
};