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

  function stripHtmlTags(str) {
    return str.replace(/<.*?>/g, "");
  }

  Analyzer.prototype.getSentiment = function(text) {
    var self = this;

    words = stripHtmlTags(text.trim()).match(/[a-zA-Z_-]+/g);
    return words.reduce(function(previousValue, word) {
      var wordInLowerCase = word.trim().toLowerCase();
      var wordSentiment = self.wordSentiment[wordInLowerCase] || 0;

      return previousValue + wordSentiment;
    }, 0);
  };

  Analyzer.prototype.getSentimentCode = function(sentimentValue) {

    //TODO: Implement
    return "neutral";
  };

  package.Analyzer = Analyzer;
  package.Analyzer.SENTIMENTS = SENTIMENTS;
})(sentiment);