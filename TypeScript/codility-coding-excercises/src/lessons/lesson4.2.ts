function identity<T>(x: T): T {
  return x
}

export function isAPermutation(arr: Array<number>): boolean { 
  const noElementsFoundYet = Array.from(Array(arr.length)).map(_ => false)
  const foundElements = arr.reduce((elementsToFind, element) => {
    if (element <= arr.length) {
      elementsToFind[element - 1] = true
    }
    return elementsToFind
  }, noElementsFoundYet)
  return foundElements.every(identity)
}