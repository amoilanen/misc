export function range(start, end, step = 1): Array<number> {
  const length = Math.floor((end - start) / step) + 1;
  return Array.from({ length }, (_, i) => start + i * step);
}

export function roundToDecimalPoints(value: number, pointsAfterDot: number): number {
  let template = Math.pow(10, pointsAfterDot);
  return Math.round(value * template) / template;
}