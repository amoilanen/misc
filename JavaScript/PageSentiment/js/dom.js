(function(package) {

  var SENTIMENTS = package.Analyzer.SENTIMENTS;

  function DOMIntegration(analyzer) {
    this.analyzer = analyzer;
  }

  //TODO: Load the word sentiment data
  //TODO: Analyze the sentiment
    //--Delete the irrelevant tags from content
    //--Skip analyzing paragraphs that do not have text content or have not enough of it
    //--Background color should change based on the sentiment
  DOMIntegration.prototype.showSentiment = function() {
    console.log("showSentiment");
    console.log("wordSentiment = ");
    console.log(this.analyzer.wordSentiment);

    //TODO: Also query for li, headers etc.?
    var elements = document.querySelectorAll("p");
    elements = [].slice.call(elements);

    elements.forEach(function(element) {
      var classAttribute = element.getAttribute("class");
      var randomSentiment = SENTIMENTS[Math.floor(Math.random() * (SENTIMENTS.length - 1))];

      element.setAttribute("class", classAttribute + " with-sentiment-added " + randomSentiment);
    });

    //TODO: Do the actual highlighting and analysis here
    //TODO: Analyze sentiment if there is sufficient text inside, i.e. we should avoid analyzing subheaders
  };

  DOMIntegration.prototype.hideSentiment = function() {
    console.log("hideSentiment");
  };

  package.DOMIntegration = DOMIntegration;
})(sentiment);