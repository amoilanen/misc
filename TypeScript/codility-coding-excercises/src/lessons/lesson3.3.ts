function tapeDifferences(arr: Array<number>): Array<number> {
  const startingDifference = arr.reduce((x, y) => x - y, 0)
  const differences = arr.reduce((acc, element) => {
    const lastDifference = acc[acc.length - 1]
    const nextDifference = lastDifference + 2 * element
    acc.push(nextDifference)
    return acc
  }, [ startingDifference ]);
  return differences.slice(1, differences.length - 1)
}

export function findMinDifference(arr: Array<number>): number {
  if (arr.length > 1) {
    const absoluteDifferences = tapeDifferences(arr).map(x => Math.abs(x))
    return Math.min(...absoluteDifferences)
  } else if (arr.length == 1) {
    return arr[0]
  } else { // arr.length == 0
    return 0
  }
}