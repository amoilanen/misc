import { findMinDifference } from '../../src/lessons/lesson3.3';

test('array of several elements', () => {
  expect(findMinDifference([3, 1, 2, 4, 3])).toEqual(1)
})

test('one element', () => {
  expect(findMinDifference([5])).toEqual(5)
})

test('no elements', () => {
  expect(findMinDifference([])).toEqual(0)
})