function generate(elements, len) {
  if (len == 1) {
    return elements.map(function(element) {
      return [element];
    });
  }
  var generated = [];
  var subsequences = generate(elements, len - 1);

  subsequences.forEach(function(subsequence) {
    elements.forEach(function(element) {
      var copy = subsequence.slice();

      copy.push(element);
      generated.push(copy);
    });
  });
  return generated;
}

console.log(generate([0, 1], 4));