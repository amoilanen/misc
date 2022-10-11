import { jumpsNumber } from '../../src/lessons/lesson3.1';

test('several jumps', () => {
  expect(jumpsNumber(10, 85, 30)).toEqual(3)
})

test('one jumps', () => {
  expect(jumpsNumber(2, 7, 10)).toEqual(1)
})

test('no jumps', () => {
  expect(jumpsNumber(5, 5, 10)).toEqual(0)
})

test('jumping in opposite direction', () => {
  expect(jumpsNumber(-10, -85, 30)).toEqual(3)
})

