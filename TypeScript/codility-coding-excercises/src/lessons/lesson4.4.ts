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

console.log(missingNumber([1, 2, 3]))