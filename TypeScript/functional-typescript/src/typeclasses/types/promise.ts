import { HKT } from '../hkt';

export type Promise_ = 'Promise_'

// Attempt to tell Typescript to treat Promise as a "higher-kinded type"
export class HKTPromise<T> extends Promise<T> implements HKT<Promise_, T> {
  _F: Promise_
  _T: T
}