export function missingNumber(input: Array<number>): number {
  const maxNumber = Math.max(...input.concat([1]))
  const initialElementPresence: Array<boolean> = Array.from(Array(maxNumber + 1)).map(_ => false)
  const finalElementPresence = input.reduceRight((presence, element) => {
    presence[element - 1] = true
    return presence
  }, initialElementPresence)
  const minimalMissingElement = finalElementPresence.findIndex(x => x == false) + 1
  return minimalMissingElement
}

export function missingNumberAlternative(input: Array<number>): number {
  const numberOccurences = input.reduceRight((occurences, element) => {
    occurences.add(element)
    return occurences
  }, new Set<number>())
  const maxNumber = Math.max(...Array.from(numberOccurences))
  let foundElement = 1
  let hasFoundElement = false
  while (!hasFoundElement && foundElement <= maxNumber) {
    if (!numberOccurences.has(foundElement)) {
      hasFoundElement = true
    } else {
      foundElement++
    }
  }
  return foundElement
}