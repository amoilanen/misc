import { applyCounterOperations } from '../../src/lessons/lesson4.3';

test('apply several operations', () => {
  expect(applyCounterOperations(5, [3, 4, 4, 6, 1, 4, 4])).toEqual([3, 2, 2, 4, 2])
})

test('apply empty list of operations', () => {
  expect(applyCounterOperations(5, [])).toEqual([0, 0, 0, 0, 0])
})

test('apply one operation - increase', () => {
  expect(applyCounterOperations(5, [4])).toEqual([0, 0, 0, 1, 0])
})

test('apply max operation', () => {
  expect(applyCounterOperations(5, [1, 1, 1, 6])).toEqual([3, 3, 3, 3, 3])
})