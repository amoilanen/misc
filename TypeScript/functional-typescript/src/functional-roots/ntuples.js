// "Lisp in C's Clothing" https://www.crockford.com/javascript/javascript.html
// https://www.quora.com/Why-did-they-say-JavaScript-is-Lisp-in-Cs-clothing

function uniqueNTuplesOf(elements, n) {
  function elementPairs(first, rest) {
    return rest.map(x => [ first ].concat(x));
  }
  if (n == 1) {
    return elements.map(x => [x]);
  } else {
    if (elements.length == 0) {
      return [];
    } else {
      const [head, ...tail] = elements;
      const tuplesWithHeadIncluded =
        elementPairs(head, uniqueNTuplesOf(tail, n - 1));
      const tailTuples = uniqueNTuplesOf(tail, n);
      return [...tuplesWithHeadIncluded, ...tailTuples];
    }
  }
}

function uniquePairsOf(elements) {
  return uniqueNTuplesOf(elements, 2);
}

const elements = [1, 2, 3, 4, 5];
console.log(uniquePairsOf(elements));

console.log(uniqueNTuplesOf(elements, 3));