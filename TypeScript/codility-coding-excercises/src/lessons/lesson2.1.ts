function rotate(arr: number[]): number[] {
  if (arr.length > 0)
    return [arr[arr.length - 1]].concat(arr.slice(0, arr.length - 1))
  else
    return []
}

function rotateTimes(arr: number[], times: number): number[] {
  return Array.from(Array(times).keys()).reduce((currentArr) => rotate(currentArr), arr);
}

console.log(rotateTimes([3, 8, 9, 7, 6], 3))