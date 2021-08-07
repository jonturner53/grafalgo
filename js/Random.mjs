/** @file Util.mjs 
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

export warning(msg) {
	console.error(`Warning: ${msg}`);
}

export error(msg) {
	console.error(`Error: ${msg}`);
	console.stacktrace();
}

export fatal(msg) {
	console.error(`Fatal: ${msg}`);
	console.stacktrace();
	process.exit();
}

fatal(msg) {
	System.err.println("Fatal: " + msg);
	System.exit(1);
}

private static Random myRand = null;

// Set the seed for the random number generator, myRand.
setSeed(seed) {
	if (myRand == null) myRand = new Random();
	myRand.setSeed(seed);
}

// Return a random number in [0,1] 
randfrac() {
	if (myRand == null) myRand = new Random();
	return myRand.nextDouble();
}

// Return a random integer in the range [lo,hi].
randint(int lo, int hi) {
	if (myRand == null) myRand = new Random();
	return lo + myRand.nextInt((hi+1) - lo);
}

// Return a random number from an exponential distribution with mean mu 
randexp(double mu) {
	if (myRand == null) myRand = new Random();
	return -mu*Math.log(myRand.nextDouble());
}

/** Return a random number from a geometric distribution.
 *  @param p is 1/(the mean of the distribution)
 *  @return a random sample
 */
randgeo(double p) {
	if (myRand == null) myRand = new Random();
	if (p > .999999) return 1;
	double x;
	x = (.999999 + Math.log(myRand.nextDouble())/Math.log(1-p));
	return Math.max(1,(int) x);
}

/** Return a random number from a truncated geometric distribution.
 *  @param p is 1/(the mean of the distribution)
 *  @param k is the max value in the distribution
 *  @return a random sample
 */
randTruncGeo(double p, int k) {
	if (myRand == null) myRand = new Random();
	double x = 1 - Math.exp((k-1)*Math.log(1-p));
	double r;
	r = .999999 + Math.log(myRand.nextDouble()/x)/Math.log(1-p);
	return ((p > .999999) ? 1 : Math.max(1,Math.min((int) r,k)));
}

/** Return a random number from a Pareto distribution.
 *  @param mu is the mean of the distribution
 *  @param s is the shape parameter
	 *  @return a random sample
 */
randpar(double mu, double s) {
	if (myRand == null) myRand = new Random();
	return mu*(1-1/s)/Math.exp((1/s)*Math.log(myRand.nextDouble()));
}

/** Create random permutation on integers 1..n and return in p.
 */
genPerm(int n, int p[]) {
	int i, j, k;
	for (i = 1; i <= n; i++) p[i] = i;
	for (i = 1; i <= n; i++) {
		j = randint(i,n);
		k = p[i]; p[i] = p[j]; p[j] = k;
	}
}
