//TODO: Carefully check corner cases of riverLength and faillintLeavesInTime
function earliestMomentToCross(riverLength: number, fallingLeavesInTime: Array<number>): number {
  let leavesToFall = new Set(Array.from(Array(riverLength).keys()))
  let currentMoment = 0
  while (currentMoment < fallingLeavesInTime.length && leavesToFall.size > 0) {
    leavesToFall.delete(fallingLeavesInTime[currentMoment] - 1)
    currentMoment++
  }
  if (leavesToFall.size == 0) {
    return currentMoment - 1
  } else {
    return -1
  }
}

console.log(earliestMomentToCross(5, [1, 3, 1, 4, 2, 3, 5, 4]))