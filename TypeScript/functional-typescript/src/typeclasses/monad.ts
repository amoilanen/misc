import { Functor } from './functor';
import { Option_, Option, Some, none } from './types/option';
import { HKT } from './hkt';

// Monad is also a Functor as it is possible to implement "map" through "pure" and "flatMap"
export abstract class Monad<M> implements Functor<M> {
  abstract pure<A>(a: A): HKT<M, A>
  abstract flatMap<A, B>(fa: HKT<M, A>, f: (v: A) => HKT<M, B>): HKT<M, B>
  map<A, B>(fa: HKT<M, A>, f: (v: A) => B): HKT<M, B> {
    return this.flatMap(fa, (v: A) => this.pure<B>(f(v)));
  }
}

// It might be much more convenient to add map directly to the Option, however, for the illustration's sake defining a separate Functor typeclass
class OptionMonad extends Monad<Option_> {
  pure<A>(a: A): Option<A> {
    return Option.from(a);
  }
  flatMap<A, B>(fa: Option<A>, f: (v: A) => Option<B>): Option<B> {
    switch (fa.typeTag) {
      case 'None':
        return none;
      case 'Some':
        return f(fa.get())
    }
  }
}

const optionMonad: Monad<Option_> = new OptionMonad();

//TODO: Promise Monad
//TODO: Array Monad

// Informally "ContextDependent<Ctx, unknown>" ~ "Ctx => unknown", i.e. "type constructor" for ContextDependent
export type ContextDependent_<Ctx> = () => Ctx

// Informally "ContextDependent<Ctx, R>" ~ "Ctx => R"
export interface ContextDependent<Ctx, R> extends HKT<ContextDependent_<Ctx>, R> {
  _F: ContextDependent_<Ctx>,
  _T: R
  (c: Ctx): R
}

/*
 * Compare with the Scala 3 version, because of Typescript not having higher kinded types, much more boiler-plate is needed
 * https://dotty.epfl.ch/docs/reference/contextual/type-classes.html#reader
 */
function readerMonad<Ctx>(): Monad<ContextDependent_<Ctx>> {
  return new class ReaderMonad<Ctx> extends Monad<ContextDependent_<Ctx>> {
    pure<A>(a: A): HKT<ContextDependent_<Ctx>, A> {
      return ((ctx: Ctx) => a) as ContextDependent<Ctx, A>;
    }
    flatMap<A, B>(fa: HKT<ContextDependent_<Ctx>, A>, f: (v: A) => HKT<ContextDependent_<Ctx>, B>): HKT<ContextDependent_<Ctx>, B> {
      return ((ctx: Ctx) => {
        return (f((fa as ContextDependent<Ctx, A>)(ctx)) as ContextDependent<Ctx, B>)(ctx);
      }) as ContextDependent<Ctx, B>;
    }
  };
}

export const MonadInstances = {
  optionMonad,
  readerMonad
};
