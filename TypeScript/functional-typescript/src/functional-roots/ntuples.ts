
type Tuples<T> = Array<Array<T>>

function uniqueNTuplesOf<T>(elements: Array<T>, n: number): Tuples<T> {
    function elementPairs<T>(first: T, rest: Tuples<T>): Tuples<T> {
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

function uniquePairsOf<T>(elements: Array<T>): Array<[T, T]> {
  return uniqueNTuplesOf(elements, 2) as Array<[T, T]>;
}

const elements = [1, 2, 3, 4, 5];
console.log(uniquePairsOf(elements));

console.log(uniqueNTuplesOf(elements, 3));

export {};