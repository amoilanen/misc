// No tail call optimization :(
// https://bugs.chromium.org/p/v8/issues/detail?id=4698 'Issue 4698: Support ES6 tail call elimination"

//function map(f, elements) {
//  ^
//
//RangeError: Maximum call stack size exceeded
function map(f, elements) {
  if (elements.length == 0) {
    return [];
  } else {
    const [head, ...tail] = elements;
    return [ f(head) ].concat(map(f, tail));
  }
}

// V8, for example, does not know how to optimize the version above into the following:
function map(f, elements) {
  let result = [];
  for (const element of elements) {
    result.push(f(element));
  }
  return result;
}

const listSize = 7000;
const elements = new Array(listSize).fill(5);

console.log(map(x => x * x, elements));