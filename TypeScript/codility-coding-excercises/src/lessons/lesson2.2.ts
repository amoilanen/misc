const elementCounts = (arr: number[]): {[key: number]: number} =>
  arr.reduceRight((counts, element) => {
    counts[element] = (counts[element] || 0) + 1
    return counts
  }, ({} as {[key: number]: number}))

function uniqueElement(arr: number[]): number | undefined {
  const counts = Object.entries(elementCounts(arr))
  const uniqueElementAndCount = counts.find(([number, count]) => count == 1)
  if (uniqueElementAndCount) {
    const [element, _] = uniqueElementAndCount
    return parseInt(element, 10)
  }
}

console.log(uniqueElement([9, 3, 9, 3, 9, 7, 9]))