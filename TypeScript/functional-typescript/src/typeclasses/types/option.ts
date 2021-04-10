import { HKT } from '../hkt';

// The higher kinded type for Option<T>, in other languages such as Scala such type is created automatically and is called a "type constructor"
export type Option_ = 'Option_'

export abstract class Option<T> implements HKT<Option_, T> {
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