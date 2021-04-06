import { Semigroup, SemigroupInstances } from './semigroup';

export interface Monoid<T> extends Semigroup<T> {
  unit: T
}

const stringMonoid: Monoid<string> = {
  ...SemigroupInstances.stringSemigroup,
  unit: ''
};

const numberAdditionMonoid: Monoid<number> = {
  ...SemigroupInstances.numberAdditionSemigroup,
  unit: 0
};

const numberMultiplicationMonoid: Monoid<number> = {
  ...SemigroupInstances.numberMultiplicationSemigroup,
  unit: 1
};

export function combineAll<T>(xs: Array<T>) {
  return (m: Monoid<T>) =>
    xs.reduceRight((acc, cur) =>
      m.combine(acc, cur)
    , m.unit);
}

export const MonoidInstances = {
  stringMonoid,
  numberAdditionMonoid,
  numberMultiplicationMonoid
};

