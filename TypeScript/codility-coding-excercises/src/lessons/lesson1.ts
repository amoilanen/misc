function toBinary(x: number): string {
  return x.toString(2)
}

function getGaps(input: number): string[] {
  const binaryRepresentation = toBinary(input)
  const sequencesOfZeros = binaryRepresentation.split('1')
  sequencesOfZeros.splice(-1, 1)
  sequencesOfZeros.splice(0, 1)
  return sequencesOfZeros.filter(sequence => sequence.length > 0)
}

export function longestGap(input: number): number {
  const gaps = getGaps(input)

  const gapLengthes = gaps.map(gap => gap.length)
  return Math.max(...gapLengthes.concat(0))
}