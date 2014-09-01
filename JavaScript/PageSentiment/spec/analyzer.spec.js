describe("Analyzer sentiment", function() {

  var analyzer;

  var knownWords = {
    "positive_word": 4,
    "negative_word": -15,
    "neutral_word": 0
  };

  beforeEach(function() {
    analyzer = new sentiment.Analyzer(knownWords);
  });

  describe("one word", function() {

    it("should return word sentiment for positive word", function() {
      expect(analyzer.getSentiment("positive_word")).toEqual(4);
    });

    it("should return word sentiment for negative word", function() {
      expect(analyzer.getSentiment("negative_word")).toEqual(-15);
    });

    it("should return word sentiment for neutral word", function() {
      expect(analyzer.getSentiment("neutral_word")).toEqual(0);
    });

    it("should return word sentiment for unknown word", function() {
      expect(analyzer.getSentiment("unknown_word")).toEqual(0);
    });

    it("should return word sentiment for positive word with whitespace symbols around it", function() {
      expect(analyzer.getSentiment(" \tpositive_word    \t\r\n")).toEqual(4);
    });
  });

  describe("sentence", function() {

    it("should analyze a sentence consisting of several negative and positive words", function() {
      expect(analyzer.getSentiment("positive_word positive_word negative_word")).toEqual(-7);
    });

    it("should analyze sentence with whitespace symbols in between words", function() {
      expect(analyzer.getSentiment("  \tpositive_word    positive_word\t\tnegative_word")).toEqual(-7);
    });

    it("should ignore case of words", function() {
      expect(analyzer.getSentiment("Positive_Word POSITIVE_WORD nEgAtIvE_wOrD")).toEqual(-7);
    });

    it("should ignore punctuation marks", function() {
      expect(analyzer.getSentiment("###positive_word, positive_word!!! negative_word. unknown:")).toEqual(-7);
    });

    it("should analyze several sentences", function() {
      expect(analyzer.getSentiment("positive_word positive_word. negative_word negative_word. positive_word.")).toEqual(-18);
    });

    it("should handle newlines properly", function() {
      expect(analyzer.getSentiment("positive_word\npositive_word negative_word")).toEqual(-7);
    });

    it("should strip nested html tags, but include their content", function() {
      expect(analyzer.getSentiment("<positive_word>positive_word</positive_word> <strong>positive_word</strong> negative_word")).toEqual(-7);
    });
  });

  //Real samples taken from http://www.reddit.com/r/javascript/comments/2a7j6d/googles_dart_language_is_now_an_official_ecma/
  describe("real samples", function() {

    beforeEach(function() {
      analyzer.wordSentiment = merge(knownWords, {
        "pretty": 1,
        "easy": 1,
        "promises": 1,
        "want": 1,
        "problem": -2,
        "boring": -3,
        "hope": 2,
        "inspired": 2,
        "like": 2,
        "messy": -1
      });
    });

    it("should analyze positive sentence with HTML", function() {
      expect(analyzer.getSentiment("<p>It has pretty easy to use streams and futures instead of messy callbacks.</p>")).toEqual(1);
    });

    it("should analyze neutral sentence", function() {
      expect(analyzer.getSentiment("<p>E.g. if you import Underscore, but actually aren't using half of the functions, those functions don't need to be included in the output.</p>")).toEqual(0);
    });

    it("should analyze strongly positive sentence", function() {
      expect(analyzer.getSentiment("Promises were included into ECMAScript 6 draft, you may want to read up on those. Also there is RX.js")).toEqual(2);
    });

    it("should analyze negative sentence", function() {
      expect(analyzer.getSentiment("The problem with Dart is that it's so boring.")).toEqual(-5);
    });
  });

  //TODO: Depending on the sentiment value different sentiment codes
  //TODO: Calibrate the sentiment codes based on some real data

  function merge(x, y) {
    var property;
    var result = {};

    for (property in x) {
      result[property] = x[property];
    }
    for (property in y) {
      result[property] = y[property];
    }
    return result;
  }
});