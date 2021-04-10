import { expect } from 'chai';

import { Semigroup, SemigroupInstances } from '../../src/typeclasses/semigroup';

describe('semigroup', () => {

  describe('semigroup laws', () => {

    function checkSemigroupLaws<T>(s: Semigroup<T>, x: T, y: T, z: T): void {
      it(`${s.constructor.name} should satisfy semigroup laws`, () => {
        checkAssociativityLaw(s, x, y, z);
      });
    }

    function checkAssociativityLaw<T>(s: Semigroup<T>, x: T, y: T, z: T): void {
      expect(
        s.combine(s.combine(x, y), z),
        `associativity law for ${s.constructor.name}`
      ).to.eql(
        s.combine(x, s.combine(y, z))
      );
    }

    checkSemigroupLaws(SemigroupInstances.stringSemigroup, 'a', 'bc', 'def');
    checkSemigroupLaws(SemigroupInstances.numberAdditionSemigroup, -4, 2, 3);
    checkSemigroupLaws(SemigroupInstances.numberMultiplicationSemigroup, 1, 2, 4);
  });
});