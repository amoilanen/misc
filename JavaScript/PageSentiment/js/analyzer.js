(function(package) {

  var SENTIMENTS = [
    "neutral",
    "happy-1",
    "happy-2",
    "happy-3",
    "happy-4",
    "angry-1",
    "angry-2",
    "angry-3",
    "angry-4"
  ];

  function Analyzer() {
  }

  Analyzer.prototype.computeSentimentValue = function(text) {

    //TODO: Implement
    return 0;
  };

  Analyzer.prototype.getSentimentString = function(sentimentValue) {

    //TODO: Implement
    return "neutral";
  };

  package.Analyzer = Analyzer;
  package.Analyzer.SENTIMENTS = SENTIMENTS;
})(sentiment);