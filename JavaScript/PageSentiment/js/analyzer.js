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

  function Analyzer(wordSentiment) {
    this.wordSentiment = wordSentiment;
  }

  Analyzer.prototype.getSentiment = function(text) {
    return this.wordSentiment[text.trim()] || 0;
  };

  Analyzer.prototype.getSentimentCode = function(sentimentValue) {

    //TODO: Implement
    return "neutral";
  };

  package.Analyzer = Analyzer;
  package.Analyzer.SENTIMENTS = SENTIMENTS;
})(sentiment);