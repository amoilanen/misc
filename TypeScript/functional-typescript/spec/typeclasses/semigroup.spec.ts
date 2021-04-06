import { expect } from 'chai';

import { Semigroup, SemigroupInstances } from '../../src/typeclasses/semigroup';

describe('semigroup', () => {

  describe('semigroup laws', () => {

    function checkAssociativityLaw<T>(s: Semigroup<T>, x: T, y: T, z: T): void {
      expect(
        s.combine(s.combine(x, y), z),
        `associativity law for ${s.constructor.name}`
      ).to.eql(
        s.combine(x, s.combine(y, z))
      );
    }

    it('combine should be associative', () => {
      checkAssociativityLaw(SemigroupInstances.stringSemigroup, 'a', 'bc', 'def');
      checkAssociativityLaw(SemigroupInstances.numberAdditionSemigroup, -4, 2, 3);
      checkAssociativityLaw(SemigroupInstances.numberMultiplicationSemigroup, 1, 2, 4);
    });
  });
});