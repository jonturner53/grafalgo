import { randomFraction,randomInteger,randomPermutation } from '../Random.mjs';

let results = new Array(10);
for (let i = 0; i < results.length; i++)
	results[i] = randomFraction();
console.log('random fractions', results.toString());

for (let i = 0; i < results.length; i++)
	results[i] = randomInteger(5, 24);
console.log('random integers in [5,24]', results.toString());

results = randomPermutation(results.length-1);
console.log(`random permutation on [1,${results.length-1}]`,results.toString());
