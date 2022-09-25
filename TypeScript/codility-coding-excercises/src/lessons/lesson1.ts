function toBinary(x: number): string {
  return x.toString(2);
}

//Example inputs
//1041
//15
//32

const input =  1041;

const binaryRepresentation = toBinary(input);
const sequencesOfZeros = binaryRepresentation.split('1');
sequencesOfZeros.splice(-1, 1);
sequencesOfZeros.splice(0, 1);
const gaps = sequencesOfZeros.filter(sequence => sequence.length > 0)

const gapLengthes = gaps.map(gap => gap.length);
const longestGap = Math.max(...gapLengthes.concat(0));

console.log(longestGap);