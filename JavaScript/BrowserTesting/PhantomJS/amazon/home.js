/**
 * Home page.
 */
(function(host) {

  function HomePage(page) {
    this.page = page;
  }

  HomePage.prototype.open = function() {
    return open(this.page, 'http://www.amazon.com/');
  };

  HomePage.prototype.searchFor = function(term) {
    this.page.evaluate(function(term) {
      var searchBox = document.querySelector('#twotabsearchtextbox');
      var searchButton = document.querySelector('input[value=Go]');

      searchBox.value = term;
      searchButton.click();
    }, term);

    //Navigation to SearchPage
    return new SearchPage(this.page);
  };

  host.HomePage = HomePage;
})(this);