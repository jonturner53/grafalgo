import { range, scramble, randomFraction, randomInteger, randomDiscrete,
	     randomPermutation } from '../Random.mjs';

let results = new Array(10);
for (let i = 0; i < results.length; i++)
	results[i] = randomFraction();
console.log('random fractions', results.toString());

for (let i = 0; i < results.length; i++)
	results[i] = randomInteger(5, 24);
console.log('random integers in [5,24]', results.toString());

results = randomPermutation(results.length-1);
console.log(`random permutation on [1,${results.length-1}]`,results.toString());

results = range(results.length-1);
scramble(results, new Set([2,7]));
console.log(`random permutation with fixed points 2 and 7 ` +
			`on [1,${results.length-1}]`,results.toString());

let cp = [.1,.3,.6,1];
console.log('sample from [.1,.2,.3,.4]', randomDiscrete(cp));
