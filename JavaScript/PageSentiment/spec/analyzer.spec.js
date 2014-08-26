describe("Analyzer sentiment", function() {

  var analyzer;

  describe("one word", function() {

    var knownWords = {
      "positive_word": 4,
      "negative_word": -15,
      "neutral_word": 0
    };

    beforeEach(function() {
      analyzer = new sentiment.Analyzer(knownWords);
    });

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
  });

  //TODO: Sentence
  //TODO: HTML included
  //TODO: Depending on the sentiment value different sentiment codes
});