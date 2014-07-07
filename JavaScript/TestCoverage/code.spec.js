var code = require("./code");
var getValues = code.getValues;
var getValuesBroken = code.getValuesBroken;
var getValuesCautious = code.getValuesCautious;
var sets = require("./generator").sets;

//Full line coverage, tests pass, implementation is largely correct
describe("getValues - full line coverage", function() {

  it("should provide values for requested keys", function() {
    expect(getValues(["key1", "key2", "key3"])).toEqual(["value1", "value2", "value3"]);
  });
});

//Full line coverage, tests pass, but the implementation is broken
describe("getValuesBroken - full line coverage", function() {

  it("should provide values for requested keys", function() {
    expect(getValuesBroken(["key1", "key2", "key3"])).toEqual(["value1", "value2", "value3"]);
  });

  //Fails! "Expected [ 'value1', 'value2', 'value3' ] to equal [ 'value1' ]."
  xit("should provide values for requested single key", function() {
    expect(getValuesBroken(["key1"])).toEqual(["value1"]);
  });
});

describe("getValues - full 'happy-path' scenario coverage", function() {

  sets(["key1", "key2", "key3"]).forEach(function(testInput) {
    var testCaseName = "should provide values for '" + testInput.join(",") + "'";

    it(testCaseName, function() {
      var expectedOutput = testInput.map(function(key) {
        return key.replace("key", "value");
      });
      expect(getValues(testInput)).toEqual(expectedOutput);
    });
  });

  //Fails! "TypeError: Cannot call method 'map' of null"
  xit("should handle invalid input properly", function() {
    expect(getValues(null)).toEqual([]);
  });
});

describe("getValuesCautious - full 'happy-path' scenario coverage plus some corner cases, defensive style", function() {

  sets(["key1", "key2", "key3"]).forEach(function(testInput) {
    var testCaseName = "should provide values for '" + testInput.join(",") + "'";

    it(testCaseName, function() {
      var expectedOutput = testInput.map(function(key) {
        return key.replace("key", "value");
      });
      expect(getValuesCautious(testInput)).toEqual(expectedOutput);
    });
  });

  it("should handle invalid input properly", function() {
    expect(getValuesCautious(null)).toEqual([]);
  });

  it("should return no value when unknown key is used", function() {
    expect(getValuesCautious(["key1", "unknown", "key3"])).toEqual(["value1", undefined, "value3"]);
  });
});