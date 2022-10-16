import { missingElement } from '../../src/lessons/lesson3.2';

test('array of several elements', () => {
  expect(missingElement([2, 3, 1, 5])).toEqual(4)
})

test('one element', () => {
  expect(missingElement([1])).toEqual(2)
})

test('no elements', () => {
  expect(missingElement([])).toEqual(1)
})