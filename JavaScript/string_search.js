function simpleSearch(text, str) {
  var matches = [];
  for (var i = 0; i <= text.length; i++) {
    if (matchesAtIndex(i, text, str)) {
      matches.push(i);
    }
  }
  return matches;
}

var primeBase = 31;

function searchRabinKarp(text, str) {
  var matches = [];

  var hashStr = hashFromTo(str, 0, str.length);
  var hashTextPart = hashFromTo(text, 0, str.length);
  var primeToPower = Math.pow(primeBase, str.length);
  var maxIndexForPotentialMatch = text.length - str.length;

  for (var i = 0; i <= maxIndexForPotentialMatch; i++) {
    if (hashTextPart === hashStr) {
      if (matchesAtIndex(i, text, str)) {
        matches.push(i);
      }
    }
    hashTextPart = primeBase * hashTextPart - primeToPower * text.charCodeAt(i) + text.charCodeAt(i + str.length);
  }

  return matches;
}

function matchesAtIndex(index, text, str) {
  var matches = true;

  for (var j = 0; j < str.length; j++) {
    if (text[index + j] !== str[j]) {
      matches = false;
      break;
    }
  }
  return matches;
}

function hashFromTo(str, from, to) {
  var hash = 0;
  for (var i = from; i < to && i < str.length; i++) {
    hash = primeBase * hash + str.charCodeAt(i);
  }
  return hash;
}

/*
 * Tests. Very primitive and naive approach for test running:
 * 1. Exceptions that may occur during a test should be handled
 * 2. Different sets of tests can be grouped into suites
 * 3. Execution should be delayed until we want to actually run the test, i.e.
 * we should pass not a boolean 'condition' to the 'test' function, but a function
 */

var testResults = {pass: 0, fail: 0}

function test(description, condition) {
  console.log(description);
  if (!condition) {
    testResults.fail += 1;
    console.log("FAIL");
  } else {
    testResults.pass += 1;
    console.log("PASS");
  }
  return condition;
}

function reportResults() {
  console.log("PASS=" + testResults.pass);
  console.log("FAIL=" + testResults.fail);
  if (testResults.fail > 0) {
    throw "Tests FAILED and should be fixed!";
  } else {
    console.log("Tests PASSED.");
  }
}

function assertArrayEquals(thisArr, thatArr){
  thisArr = thisArr.join(",");
  thatArr = thatArr.join(",");
  var arraysEqual = ( thisArr === thatArr);

  if (!arraysEqual) {
    console.log("Expected [" + thisArr + "] but was [" + thatArr + "]");
  }
  return arraysEqual;
}

[simpleSearch, searchRabinKarp].forEach(function(f) {
  test("str is empty", assertArrayEquals([0, 1, 2, 3], f("abc", "")));
  test("text is empty", assertArrayEquals([], f("", "abc")));
  test("str.length < text.length and match", assertArrayEquals([2], f("abcdefgh", "cde")));
  test("str.length < text.length and no match", assertArrayEquals([], f("abcdefgh", "klm")));
  test("str.length < text.length and several matches", assertArrayEquals([2, 8, 14], f("abcdefabcdefabcdef", "cd")));
  test("str.length == text.length and match", assertArrayEquals([0], f("abc", "abc")));
  test("str.length == text.length and no match", assertArrayEquals([], f("abc", "def")));
  test("str.length > text.length", assertArrayEquals([], f("abc", "abcd")));
  test("long string", assertArrayEquals([2], f("abcdabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabc", "cd")));
});

reportResults();