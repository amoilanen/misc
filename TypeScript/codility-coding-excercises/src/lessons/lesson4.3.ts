function applyCounterOperations(operations: Array<number>, counterNumber: number): Array<number> {
  const initialState: [number, number[]] = [0, Array.from(Array(counterNumber)).map(_ => 0)]
  const [_, updatedCounters] = operations.reduce(([maxCounter, counters], operation) => {
    let updatedMaxCounter = maxCounter
    if (operation <= counterNumber && operation >= 1) {
      counters[operation - 1] = counters[operation - 1] + 1
      updatedMaxCounter = Math.max(maxCounter, counters[operation - 1])
    } else if (operation == counterNumber + 1) {
      counters = counters.map(_ => maxCounter)
    }
    // console.log(`Operation ${operation}`)
    // console.log(counters)
    const updatedState: [number, number[]] = [updatedMaxCounter, counters]
    return updatedState
  }, initialState)
  return updatedCounters
}

const counters = applyCounterOperations([3, 4, 4, 6, 1, 4, 4], 5)
console.log(counters)