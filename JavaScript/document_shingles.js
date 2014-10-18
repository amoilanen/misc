function getShingles(doc, k) {
  var shingles = [];

  for (var i = 0; i + k <= doc.length; i++) {
    var shingle = doc.slice(i, i + k);

    if (shingles.indexOf(shingle) < 0) {
      shingles.push(shingle);
    }
  }
  return shingles;
}

var doc = "abcdeabc";

console.log(getShingles(doc, 2));