import { HKT } from '../hkt';

export type Array_ = 'Array_'

// Telling Typescript to treat Array as a "higher-kinded type"
export class HKTArray<T> extends Array<T> implements HKT<Array_, T> {
  _F: Array_
  _T: T
}