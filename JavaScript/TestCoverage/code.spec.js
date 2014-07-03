var code = require("./code");
var getInfo = code.getInfo;
var getInfoBroken = code.getInfoBroken;
var getInfoCautious = code.getInfoCautious;
var sets = require("./generator").sets;

//Full line coverage, tests pass, implementation is largely correct
describe("getInfo - full line coverage", function() {

  it("should provide values for requested keys", function() {
    expect(getInfo(["key1", "key2", "key3"])).toEqual(["value1", "value2", "value3"]);
  });
});

//Full line coverage, tests pass, but the implementation is broken
describe("getInfoBroken - full line coverage", function() {

  it("should provide values for requested keys", function() {
    expect(getInfoBroken(["key1", "key2", "key3"])).toEqual(["value1", "value2", "value3"]);
  });

  //Fails! "Expected [ 'value1', 'value2', 'value3' ] to equal [ 'value1' ]."
  xit("should provide values for requested single key", function() {
    expect(getInfoBroken(["key1"])).toEqual(["value1"]);
  });
});

describe("getInfo - full 'happy-path' scenario coverage", function() {

  sets(["key1", "key2", "key3"]).forEach(function(testInput) {
    var testCaseName = "should provide values for '" + testInput.join(",") + "'";

    it(testCaseName, function() {
      var expectedOutput = testInput.map(function(key) {
        return key.replace("key", "value");
      });
      expect(getInfo(testInput)).toEqual(expectedOutput);
    });
  });

  //Fails! "TypeError: Cannot call method 'map' of null"
  xit("should handle invalid input properly", function() {
    expect(getInfo(null)).toEqual([]);
  });
});

describe("getInfoCautious - full 'happy-path' scenario coverage plus some corner cases, defensive style", function() {

  sets(["key1", "key2", "key3"]).forEach(function(testInput) {
    var testCaseName = "should provide values for '" + testInput.join(",") + "'";

    it(testCaseName, function() {
      var expectedOutput = testInput.map(function(key) {
        return key.replace("key", "value");
      });
      expect(getInfoCautious(testInput)).toEqual(expectedOutput);
    });
  });

  it("should handle invalid input properly", function() {
    expect(getInfoCautious(null)).toEqual([]);
  });

  it("should return no value when unknown key is used", function() {
    expect(getInfoCautious(["key1", "unknown", "key3"])).toEqual(["value1", "value3"]);
  });
});