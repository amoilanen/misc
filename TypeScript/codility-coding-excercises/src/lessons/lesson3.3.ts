function tapeDifferences(arr: Array<number>): Array<number> {
  const startingDifference = arr.reduce((x, y) => x - y, 0)
  const differences = arr.reduce((acc, element) => {
    const lastDifference = acc[acc.length - 1]
    const nextDifference = lastDifference + 2 * element
    acc.push(nextDifference)
    return acc
  }, [ startingDifference ]);
  if (differences.length > 2) {
    return differences.slice(1, differences.length - 1)
  } else {
   return [arr[0]] // the case when the array consists of 1 element
  }
}

function findMinDifference(arr: Array<number>): number {
  const absoluteDifferences = tapeDifferences(arr).map(x => Math.abs(x))
  return Math.min(...absoluteDifferences)
}

const arr = [3, 1, 2, 4, 3]
console.log(tapeDifferences(arr))
console.log(findMinDifference(arr))