import { isAPermutation } from '../../src/lessons/lesson4.2';

test('array of several elements: is a permutation', () => {
  expect(isAPermutation([4, 1, 3, 2])).toBe(true)
})

test('array of several elements: is not a permutation', () => {
  expect(isAPermutation([4, 1, 3])).toBe(false)
})

test('empty array', () => {
  expect(isAPermutation([])).toBe(true)
})

test('array of one element', () => {
  expect(isAPermutation([1])).toBe(true)
})