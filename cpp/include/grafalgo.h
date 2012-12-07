/** @file grafalgo.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef GRAFALGO_H
#define GRAFALGO_H

namespace grafalgo {

typedef long int index;
typedef long int position
typedef long int vertex
typedef long int edge

inline void warning(string msg) { cerr << "Warning: " << msg << endl; }

inline void fatal(string msg) {
	cerr << "Fatal: " << msg << endl;
	if (errno != 0) perror("");
	exit(1);
}

double pow(double,double);
double log(double);

double exp(double),log(double);

// Return a random number in [0,1] 
inline double randfrac() { return ((double) random())/BIGINT; }

// Return a random integer in the range [lo,hi].
// Not very good if range is larger than 10**7.
inline int randint(int lo, int hi) { return lo + (random() % (hi + 1 - lo)); }

// Return a random number from an exponential distribution with mean mu 
inline double randexp(double mu) { return -mu*log(randfrac()); }

// Return a random number from a geometric distribution with mean 1/p
inline int randgeo(double p) {
	return p > .999999 ? 1 : max(1,int(.999999 +log(randfrac())/log(1-p)));
}

// Return a random number from a truncated geometric distribution with mean 1/p
// and maximum value k.
inline int randTruncGeo(double p, int k) {
	double x = 1 - exp((k-1)*log(1-p));
	int r = int(.999999+log(randfrac()/x)/log(1-p));
	return p > .999999 ? 1 : max(1,min(r,k));
}

// Return a random number from a truncated geometric distribution with mean 1/p
// and maximum value k.
inline long long int randTruncGeo(double p, long long int k) {
	double x = 1 - exp((k-1)*log(1-p));
	int r = int(.999999+log(randfrac()/x)/log(1-p));
	return p > .999999 ? 1 : max(1,min(r,k));
}

// Return a random number from a Pareto distribution with mean mu and shape s
inline double randpar(double mu, double s) {
	return mu*(1-1/s)/exp((1/s)*log(randfrac()));
}

}

#endif
