import { expect } from 'chai';

import { HKT } from '../../src/typeclasses/hkt';
import { Functor, FunctorInstances } from '../../src/typeclasses/functor';
import { Some } from '../../src/typeclasses/types/option';
import { HKTPromise } from '../../src/typeclasses/types/promise';
import { HKTArray } from '../../src/typeclasses/types/array';

describe('functor', () => {

  //TODO: Comparing the equality of two Promises would require comparing the values wrapped in each of them: implement, with HKT support
  interface Equal<T> {
    eq(x: T, y: T): boolean
  }

  describe('functor laws', () => {

    async function checkFunctorLaws<F, A, B, C>(f: Functor<F>, fa: HKT<F, A>, g: (v: A) => B, h: (v: B) => C): Promise<void> {
      await checkCompositionLaw(f, fa, g, h);
      await checkIdentityLaw(f, fa);
    }

    async function checkCompositionLaw <F, A, B, C>(f: Functor<F>, fa: HKT<F, A>, g: (v: A) => B, h: (v: B) => C): Promise<void> {
      expect(
        await f.map(fa, v => h(g(v))),
        `composition law for ${f.constructor.name}`
      ).to.eql(
        await f.map(f.map(fa, g), h)
      );
    }

    async function checkIdentityLaw<F, A>(f: Functor<F>, fa: HKT<F, A>): Promise<void> {
      expect(
        await f.map(fa, a => a),
        `identity law for ${f.constructor.name}`
      ).to.eql(
        await fa
      );
    }

    it('should satisfy functor laws', async () => {
      await checkFunctorLaws(FunctorInstances.optionFunctor, new Some("abc"), s => s.length, n => `${n}_letters`);
      await checkFunctorLaws(FunctorInstances.promiseFunctor, Promise.resolve("abc") as HKTPromise<string>, s => s.length, n => `${n}_letters`);
      await checkFunctorLaws(FunctorInstances.arrayFunctor, [1, 2, 3] as HKTArray<number>, n => String.fromCharCode(n), s => s.toUpperCase());
    });
  });

  describe('PromiseFunctor', () => {

    it('should be applicable to vanilla Promises', async () => {
      let value = "abcabcabc"
      let f = FunctorInstances.promiseFunctor;
      let input = Promise.resolve(value) as HKTPromise<string>;

      expect(await f.map(input, _ => _.length)).to.eql(value.length);
    });
  });
});