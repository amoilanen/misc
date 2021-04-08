// Taking inspiration from https://medium.com/@gcanti/higher-kinded-types-in-typescript-static-and-fantasy-land-d41c361d0dbe, the author of fp-ts

import { HKT } from './hkt';

export interface Functor<F> {
  map<A, B>(fa: HKT<F, A>, f: (v: A) => B): HKT<F, B>
}

// The higher kinded type for Option<T>, in other languages such as Scala such type is created automatically and is called a "type constructor"
export type Option_ = 'Option_'

abstract class Option<T> implements HKT<Option_, T> {
  _F: Option_
  _T: T
  readonly typeTag: 'None' | 'Some'
  abstract get(): T
}

export class Some<T> extends Option<T> {
  readonly typeTag: 'Some' = 'Some'
  constructor(readonly value: T) {
    super();
  }
  get(): T {
    return this.value;
  }
}

export class None extends Option<never> {
  readonly typeTag: 'None' = 'None'
  private constructor() {
    super();
  }
  get(): never {
    throw new Error(`None.get: no value wrapped`);
  }
  static instance: None = new None();
}

export const none: None = None.instance;

// It might be much more convenient to add map directly to the Option, however, for the illustration's sake defining a separate Functor typeclass
export class OptionFunctor implements Functor<Option_> {
  map<A, B>(fa: Option<A>, f: (v: A) => B): Option<B> {
    switch (fa.typeTag) {
      case 'None':
        return None.instance;
      case 'Some':
        return new Some(f(fa.get()))
    }
  }
}

const optionFunctor: Functor<Option_> = new OptionFunctor();

export type Promise_ = 'Promise_'

class HKTPromise<T> extends Promise<T> implements HKT<Promise_, T> {
  _F: Promise_
  _T: T
}

// Again it might be much more convenient to add map directly to Promise, however, for the illustration's sake defining a separate Functor typeclass
export class PromiseFunctor implements Functor<Promise_> {

  map<A, B>(fa: HKTPromise<A>, f: (v: A) => B): HKTPromise<B>

  map<A, B>(fa: Promise<A>, f: (v: A) => B): Promise<B> {
    return fa.then(v => f(v));
  }
}

const promiseFunctor: Functor<Promise_> = new PromiseFunctor();

//TODO: Array Functor

export const FunctorInstances = {
  optionFunctor,
  promiseFunctor
};