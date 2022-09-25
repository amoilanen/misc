function toBinary(x: number): string {
  return x.toString(2);
}

//Example inputs
//1041
//15
//32

let input =  1041;

let binaryRepresentation = toBinary(input);

console.log(binaryRepresentation);

let sequencesOfZeros = binaryRepresentation.split('1');
sequencesOfZeros.splice(-1, 1);
sequencesOfZeros.splice(0, 1);
let gaps = sequencesOfZeros.filter(sequence => sequence.length > 0)

let gapLengthes = gaps.map(gap => gap.length);
let longestGap = Math.max.apply(Math, gapLengthes.concat(0));

console.log(longestGap);