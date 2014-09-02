(function(package) {

  var MIN_RECOGNIZED_SENTIMENT = -4;
  var MAX_RECOGNIZED_SENTIMENT = 4;

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

  Analyzer.prototype.getSentimentCode = function(sentiment) {
    var sentimentSign;

    //Scale logarithmically
    if (sentiment != 0) {
      sentimentSign = (sentiment / Math.abs(sentiment));
      sentiment =  sentimentSign * (Math.floor(Math.log(Math.abs(sentiment)) / Math.log(2)) + 1);
    }

    //Make sure sentiment is in the borders of recognizable sentiments
    sentiment = Math.min(Math.max(sentiment, MIN_RECOGNIZED_SENTIMENT), MAX_RECOGNIZED_SENTIMENT);

    //Map to the code
    return (sentiment > 0) ? "happy-" + sentiment : (
        (sentiment < 0) ? "angry-" + Math.abs(sentiment) : "neutral"
      );
  };

  package.Analyzer = Analyzer;
})(sentiment);