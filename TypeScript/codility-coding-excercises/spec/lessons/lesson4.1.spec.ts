import { earliestMomentToCross } from '../../src/lessons/lesson4.1';

test('earliest moment to cross comes after some time', () => {
  expect(earliestMomentToCross(5, [1, 3, 1, 4, 2, 3, 5, 4])).toEqual(6)
})

test('moment to cross never comes', () => {
  expect(earliestMomentToCross(4, [1, 2, 3, 2, 1, 1])).toEqual(-1)
})

test('no leaves fall', () => {
  expect(earliestMomentToCross(4, [])).toEqual(-1)
})

test('unit length river and only one leaf falls', () => {
  expect(earliestMomentToCross(1, [1])).toEqual(0)
})

test('river of length 0', () => {
  expect(earliestMomentToCross(0, [1, 2, 3, 2, 1])).toEqual(0)
})