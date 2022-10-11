export const jumpsNumber = (from: number, to: number, jumpLength: number): number =>
  Math.ceil(Math.abs(to - from) / jumpLength)