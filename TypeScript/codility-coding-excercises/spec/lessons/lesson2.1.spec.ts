import { rotateTimes as rotateTimesInefficiently, rotateTimesEfficiently as rotateTimes } from '../../src/lessons/lesson2.1';

test('rotate zero times', () => {
  expect(rotateTimes([1, 2, 3], 0)).toEqual([1, 2, 3])
})

test('rotate one time', () => {
  expect(rotateTimes([1, 2, 3, 4, 5], 1)).toEqual([5, 1, 2, 3, 4])
})

test('rotate several time', () => {
  expect(rotateTimes([1, 2, 3, 4, 5], 3)).toEqual([3, 4, 5, 1, 2])
})