/**
 * Search page.
 */
(function(host) {

  function SearchPage(page) {
    this.page = page;
  }

  SearchPage.prototype.hasResultsPageLoaded = function() {
    return this.page.evaluate(function() {
      var noResultsTitle = document.querySelector('#noResultsTitle');
      var results = document.querySelectorAll('.s-result-item');

      return !!noResultsTitle || (results.length > 0);
    });
  };

  SearchPage.prototype.waitForResults = function() {
    return waitFor(this.hasResultsPageLoaded.bind(this));
  }

  SearchPage.prototype.getFirstResult = function() {
    return this.page.evaluate(function() {
      var noResultsTitle = document.querySelector('#noResultsTitle');

      if (noResultsTitle) {
        return;
      }

      var itemElement = document.querySelector('.s-result-item');

      var title = itemElement.querySelector('.s-access-title').innerHTML;
      var price = itemElement.querySelector('.a-color-price').innerHTML;
      var rating = itemElement.querySelector('.a-icon-star .a-icon-alt').innerHTML;

      return {
        title: title,
        price: price,
        rating: rating
      };
    });
  };

  host.SearchPage = SearchPage;
})(this);