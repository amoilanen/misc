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

  //TODO: Dictionary, several positive and negative words
  //TODO: Real world example of a sentence

  //TODO: Depending on the sentiment value different sentiment codes
  //TODO: Calibrate the sentiment codes based on some real data
});