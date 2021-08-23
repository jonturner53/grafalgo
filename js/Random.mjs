 /** @file Random.mjs 
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

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
export function randexp(mu) {
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
export function randomTruncatedGeomentric(p, k) {
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

/** Create random permutation.
 *  @param n is an integer
 *  @return an array containing a random permutation on [1, n].
 *  in the entries with indices in [1, n]
 */
export function randomPermutation(n) {
	let p = new Array(n+1);
	for (let i = 1; i <= n; i++) p[i] = i;
	for (let i = 1; i <= n; i++) {
		let j = randomInteger(i,n);
		let k = p[i]; p[i] = p[j]; p[j] = k;
	}
	return p;
}
