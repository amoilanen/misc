function rotate(arr: number[]): number[] {
  if (arr.length > 0)
    return [arr[arr.length - 1]].concat(arr.slice(0, arr.length - 1))
  else
    return []
}

export function rotateTimes(arr: number[], times: number): number[] {
  return Array.from(Array(times).keys()).reduce((currentArr) => rotate(currentArr), arr);
}

export function rotateTimesEfficiently(arr: number[], times: number): number[] {
  Array.from(Array(times).keys()).forEach(_ => {
    const lastElement = arr[arr.length - 1]
    for (let i = arr.length - 1; i > 0; i--) {
      arr[i] = arr[i - 1]
    }
    arr[0] = lastElement
  })
  return arr
}