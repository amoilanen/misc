export function missingElement(arr: Array<number>): number {
  let elementPresence: Array<boolean | undefined> = Array(arr.length + 1)
  arr.forEach(element => {
    elementPresence[element - 1] = true
  })
  const missingElement = elementPresence.findIndex(element => element == undefined)
  return missingElement + 1
}