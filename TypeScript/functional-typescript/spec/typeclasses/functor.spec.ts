import { expect } from 'chai';

import { HKT } from '../../src/typeclasses/hkt';
import { Functor, FunctorInstances, Some } from '../../src/typeclasses/functor';

describe('functor', () => {

  //TODO: Comparing the equality of two Promises would require comparing the values wrapped in each of them: implement, with HKT support
  interface Equal<T> {
    eq(x: T, y: T): boolean
  }

  describe('functor laws', () => {

    function checkFunctorLaws<F, A, B, C>(f: Functor<F>, fa: HKT<F, A>, g: (v: A) => B, h: (v: B) => C): void {
      checkCompositionLaw(f, fa, g, h);
      checkIdentityLaw(f, fa);
    }

    function checkCompositionLaw <F, A, B, C>(f: Functor<F>, fa: HKT<F, A>, g: (v: A) => B, h: (v: B) => C): void {
      expect(
        f.map(fa, v => h(g(v))),
        `composition law for ${f.constructor.name}`
      ).to.eql(
        f.map(f.map(fa, g), h)
      );
    }

    function checkIdentityLaw<F, A>(f: Functor<F>, fa: HKT<F, A>): void {
      expect(
        f.map(fa, a => a),
        `identity law for ${f.constructor.name}`
      ).to.eql(
        fa
      );
    }

    it('should satisfy functor laws', () => {
      checkFunctorLaws(FunctorInstances.optionFunctor, new Some("abc"), s => s.length, n => `${n}_letters`);
    });
  });
});