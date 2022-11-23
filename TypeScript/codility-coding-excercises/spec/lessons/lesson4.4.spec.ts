import { missingNumber } from '../../src/lessons/lesson4.4';

test('apply several operations', () => {
  expect(missingNumber([1, 2, 3])).toBe(4)
})

test('apply empty list of operations', () => {
  expect(missingNumber([-1, -3])).toBe(1)
})

test('apply several operations', () => {
  expect(missingNumber([1, 3, 6, 4, 1, 2])).toBe(5)
})