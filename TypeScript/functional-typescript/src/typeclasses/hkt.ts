// Typescript does not have higher-kinded types, or types which can be constructed by taking other types as type parameters
export interface HKT<F, T> {
  _F: F,
  _T: T
}