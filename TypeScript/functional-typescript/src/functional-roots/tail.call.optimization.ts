// No tail call optimization :(
// https://bugs.chromium.org/p/v8/issues/detail?id=4698 'Issue 4698: Support ES6 tail call elimination"

// Suggestions to improve it for Typescript https://github.com/microsoft/TypeScript/issues/32743 "Tail Call Optimization (TCO) implementation in compile time"

function map_<T, U>(f: (v: T) => U, elements: Array<T>): Array<U> {
  if (elements.length == 0) {
    return [];
  } else {
    const [head, ...tail] = elements;
    return [ f(head) ].concat(map(f, tail));
  }
}

// V8, for example, does not know how to optimize the version above into the following:
function map<T, U>(f: (v: T) => U, elements: Array<T>): Array<U> {
  let result = [];
  for (const element of elements) {
    result.push(f(element));
  }
  return result;
}

const listSize = 15000;
const elements = new Array(listSize).fill(5);

console.log(map(x => x * x, elements));

export {}