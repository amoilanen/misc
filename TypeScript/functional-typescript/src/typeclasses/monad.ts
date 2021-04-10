//TODO: Demonstrate that every Monad can be also viewed as a functor (i.e. map can be implemented via pure and flatMap)

//TODO: Option Monad
//TODO: Promise Monad
//TODO: Array Monad
//TODO: Reader Monad

import { Context } from 'mocha';
import { HKT } from './hkt';

export interface Monad<M> {
  pure<A>(a: A): HKT<M, A>
  flatMap<A, B>(fa: HKT<M, A>, f: (v: A) => HKT<M, B>): HKT<M, B>
}


// Corresponds to "<R> Ctx => R"
type ContextDependent_<Ctx> = () => Ctx

// Roughly corresponds to "Ctx => R"
interface ContextDependent<Ctx, R> extends HKT<ContextDependent_<Ctx>, R> {
  _F: ContextDependent_<Ctx>,
  _T: R
  (c: Ctx): R
}

function readerMonad<Ctx>(): Monad<ContextDependent_<Ctx>> {
  return new class ReaderMonad<Ctx> implements Monad<ContextDependent_<Ctx>> {
    pure<A>(a: A): HKT<ContextDependent_<Ctx>, A> {
      return ((ctx: Ctx) => a) as ContextDependent<Ctx, A>;
    }
    flatMap<A, B>(fa: HKT<ContextDependent_<Ctx>, A>, f: (v: A) => HKT<ContextDependent_<Ctx>, B>): HKT<ContextDependent_<Ctx>, B> {
      return ((ctx: Ctx) => {
        (f((fa as ContextDependent<Ctx, A>)(ctx)) as ContextDependent<Ctx, B>)(ctx);
      }) as ContextDependent<Ctx, B>;
    }
  };
}

export const MonadInstances = {
};
