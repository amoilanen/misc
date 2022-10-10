import { uniqueElement } from '../../src/lessons/lesson2.2';

test('one element duplicated, another unique', () => {
  expect(uniqueElement([2, 1, 2])).toEqual(1)
})

test('one element unique', () => {
  expect(uniqueElement([9, 3, 9, 3, 9, 7, 9])).toEqual(7)
})

test('one element occurs odd number of times', () => {
  expect(uniqueElement([1, 2, 1, 2, 3, 1, 3, 1, 2])).toEqual(2)
})