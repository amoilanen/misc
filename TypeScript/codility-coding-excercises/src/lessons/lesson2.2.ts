const elementCounts = (arr: number[]): {[key: number]: number} =>
  arr.reduceRight((counts, element) => {
    counts[element] = (counts[element] || 0) + 1
    return counts
  }, ({} as {[key: number]: number}))

export function uniqueElement(arr: number[]): number | undefined {
  const counts = Object.entries(elementCounts(arr))
  const uniqueElementAndCount = counts.find(([_, count]) => count % 2 == 1)
  if (uniqueElementAndCount) {
    const [element, _] = uniqueElementAndCount
    return parseInt(element, 10)
  }
}

function optimizedElementCounts(arr: number[]): {[key: number]: number} {
  let counts: {[key: number]: number} = {}
  arr.forEach(el => 
    counts[el] = (counts[el] || 0) + 1
  )
  return counts
}

export function optimizedUniqueElement(arr: number[]): number | undefined {
  const counts = optimizedElementCounts(arr)
  for (let el in counts) {
    if (counts[el] % 2 == 1)
      return parseInt(el, 10)
  }
}

console.log(uniqueElement([9, 3, 9, 3, 9, 7, 9]))