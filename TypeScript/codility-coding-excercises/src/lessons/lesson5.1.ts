enum Direction {
  EAST = 0,
  WEST = 1
}

function numberOfPassingCarPairs(cars: Array<number>): number {
  function carsGoingInDirection(carsZippedWithIndex: Array<[number, number]>, direction: Direction): Array<number> {
    return carsZippedWithIndex.filter(([element, index]) => element == direction).map(([element, index]) => index)
  }
  let carsZippedWithIndex: Array<[number, number]> = cars.map((element, index) => [element, index])
  let carsGoingEast = carsGoingInDirection(carsZippedWithIndex, Direction.EAST)
  let carsGoingWest = carsGoingInDirection(carsZippedWithIndex, Direction.WEST)
  return carsGoingEast.reduceRight((acc, carGoingEast) => {
    let pairsWithWestGoingCars = carsGoingWest.filter(carGoingWest => carGoingWest > carGoingEast).length
    return acc + pairsWithWestGoingCars
  }, 0)
}

console.log(numberOfPassingCarPairs([0, 1, 0, 1, 1]))