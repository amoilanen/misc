// Taking inspiration from https://medium.com/@gcanti/higher-kinded-types-in-typescript-static-and-fantasy-land-d41c361d0dbe, the author of fp-ts

import { HKT } from './hkt';
import { Option_, Option, Some, none } from './types/option';
import { Promise_, HKTPromise } from './types/promise';
import { Array_, HKTArray } from './types/array';

export interface Functor<F> {
  map<A, B>(fa: HKT<F, A>, f: (v: A) => B): HKT<F, B>
}

// It might be much more convenient to add map directly to the Option, however, for the illustration's sake defining a separate Functor typeclass
class OptionFunctor implements Functor<Option_> {
  map<A, B>(fa: Option<A>, f: (v: A) => B): Option<B> {
    switch (fa.typeTag) {
      case 'None':
        return none;
      case 'Some':
        return new Some(f(fa.get()))
    }
  }
}

const optionFunctor: Functor<Option_> = new OptionFunctor();

// Again it might be much more convenient to add map directly to Promise, however, for the illustration's sake defining a separate Functor typeclass
class PromiseFunctor implements Functor<Promise_> {

  map<A, B>(fa: HKTPromise<A>, f: (v: A) => B): HKTPromise<B> {
    return fa.then(v => f(v)) as HKTPromise<B>;
  }
}

const promiseFunctor: Functor<Promise_> = new PromiseFunctor();

// The method "map" already exists on an Array. adding it here again via a Functor just for the sake of illustration
class ArrayFunctor implements Functor<Array_> {

  map<A, B>(fa: HKTArray<A>, f: (v: A) => B): HKTArray<B> {
    return fa.map(f) as HKTArray<B>;
  }
}

const arrayFunctor: Functor<Array_> = new ArrayFunctor();

export const FunctorInstances = {
  optionFunctor,
  promiseFunctor,
  arrayFunctor
};