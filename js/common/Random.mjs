 /** @file Random.mjs 
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

/** Create range array.
 *  @param n is a positive integer
 *  @param hi >= lo is a second integer
 *  @return [0, 1,..., n]
 */
export function range(n) {
	let p = new Array(n+1);
	for (let i = 0; i <= n; i++) p[i] = i;
	return p;
}

/** Shuffle an array, based on a permutation
 *  @param a is an array of values n+1 values
 *  @param perm is an array with the same length as a that defines a
 *  permutation on 1..n in positions 1..n
 */
export function shuffle(a, perm) {
	let b = a.slice(0);
	for (let i = 1; i < a.length; i++) a[perm[i]] = b[i];
}

// Return a random number in [0,1] 
export function randomFraction() {
	return Math.random();
}

/** Return a random integer in the range [lo,hi].
 *  @param lo is an integer
 *  @param hi is a larger integer
 *  @return an integer in the range [lo, hi] (inclusive)
 */
export function randomInteger(lo, hi) {
	lo = Math.floor(lo); hi = Math.floor(hi);
	return lo + Math.floor(Math.random() * ((hi+1) - lo));
}

// Return a random number from an exponential distribution with mean mu 
export function randomExp(mu) {
	return -mu * Math.log(randomFraction());
}

/** Return a random number from a geometric distribution.
 *  @param p is 1/(the mean of the distribution)
 *  @return a random sample
 */
export function randomGeometric(p) {
	if (p > .999999999) return 1.0;
	let x = (.999999999 + Math.log(randomFraction())/Math.log(1-p));
	return Math.max(1, x);
}

/** Return a random number from a truncated geometric distribution.
 *  @param p is 1/(the mean of the distribution)
 *  @param k is the max value in the distribution
 *  @return a random sample
 */
export function randomTruncatedGeometric(p, k) {
	let x = 1 - Math.exp((k-1)*Math.log(1-p));
	let r = .999999999 + Math.log(randomFraction()/x) / Math.log(1-p);
	return ((p > .999999999) ? 1 : Math.max(1,Math.min(Math.floor(r), k)));
}

/** Return a random number from a Pareto distribution.
 *  @param mu is the mean of the distribution
 *  @param s is the shape parameter
 *  @return a random sample
 */
export function randomPareto(mu, s) {
	return mu*(1-1/s) / Math.exp((1/s)*Math.log(randfrad()));
}

/** Fill an array with values from a function.
 *  @param a is an array to be filled
 *  @param f is a function, typically a random number generator,
 *  called using the remaining arguments that follow f;
 *  for example to fill an array with random integers in 1..10
 *  use randomFill(a, randomInteger, 1, 10);
 */ 
export function randomFill(a, f) {
	let args=([].slice.call(arguments)).slice(2);
	for (let i = 0; i < a.length; i++) a[i] = f(...args);
}

/** Create random permutation.
 *  @param n is an integer
 *  @return an array containing a random permutation on 1..n in
 *  in positions 1..n
 */
export function randomPermutation(n) {
	let a = range(n); scramble(a);
	return a;
}

/** Scramble an array, that is, permute the entries randomly.
 *  @param a is an array of n+1 values
 *  @return a scrambled version of a in which the values in positions
 *  1..n are randomly permuted
 */
export function scramble(a) {
	for (let i = 1; i < a.length; i++) {
		let j = randomInteger(i, a.length-1);
		//[a[i], a[j]] = [a[j], a[i]];
		let k = a[i]; a[i] = a[j]; a[j] = k;
	}
}
