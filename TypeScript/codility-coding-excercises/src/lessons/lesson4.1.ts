export function earliestMomentToCross(riverLength: number, fallingLeavesInTime: Array<number>): number {
  if (riverLength > 0) {
    let leavesToFall = new Set(Array.from(Array(riverLength).keys()).map(x => x + 1))
    let currentMoment = 0
    while (currentMoment < fallingLeavesInTime.length && leavesToFall.size > 0) {
      leavesToFall.delete(fallingLeavesInTime[currentMoment])
      currentMoment++
    }
    if (leavesToFall.size == 0) {
      return currentMoment - 1
    } else {
      return -1
    }
  } else {
    return 0
  }
}