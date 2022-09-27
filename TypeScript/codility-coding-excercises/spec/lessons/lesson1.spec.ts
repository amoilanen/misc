import { longestGap } from '../../src/lessons/lesson1';

class Fixture {
  constructor(readonly input: number, readonly answer: number) {}
}

const fixtures = [
  [1041, 5],
  [9, 2],
  [529, 4],
  [20, 1],
  [15, 0],
  [3, 0]
].map(([input, answer]) => new Fixture(input, answer))

fixtures.forEach(fixture =>
  test(`longest gap in ${fixture.input}`, () => {
    expect(longestGap(fixture.input)).toBe(fixture.answer)
  })
)
