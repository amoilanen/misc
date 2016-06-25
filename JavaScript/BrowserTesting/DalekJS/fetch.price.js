/*
 * Running the script:
 *   dalek fetch.price.js Javascript -l 4
 */

var bookTitle = process.argv[3];

console.log('Searching Amazon.com for "' + bookTitle + '"');
module.exports = {
  'Fetch price from Amazon': function(test) {
    test
      .open('http://www.amazon.com')
      .type('#twotabsearchtextbox', bookTitle)
      .click('input[value=Go]')
      .waitFor(function() {
        function isSearchFinished() {
          var noResultsTitle = document.querySelector('#noResultsTitle');
          var results = document.querySelectorAll('.s-result-item');

          return !!noResultsTitle || (results.length > 0);
        }

        return isSearchFinished();
      })
      .execute(function() {
        function getBookInfo() {
          var noResultsTitle = document.querySelector('#noResultsTitle');

          if (noResultsTitle) {
            return {};
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

        this.data('bookInfo', getBookInfo());
      })
      .log.message(function() {
        var bookInfo = test.data('bookInfo');

        if (!bookInfo) {
          return 'No results found for "' + bookTitle + '\"';
        } else {
          return [
            'Title = ' + bookInfo.title,
            'Price = ' + bookInfo.price,
            'Rating = ' + bookInfo.rating
          ].join('\n');
        }
      })
      .done();
    }
};