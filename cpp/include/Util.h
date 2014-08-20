/** @file Util.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef UTIL_H
#define UTIL_H

#include "stdinc.h"

using namespace std;

namespace grafalgo {

/** This class contains miscellaneous utility methods.
 */
class Util {
public:
	static const int32_t BIGINT32 = 0x7ffffff;

	// basic input helper functions
	static bool skipSpace(istream& in, bool=false);
	static bool skipBlank(istream& in);
	static bool nextLine(istream& in);
	static bool readWord(istream&, string&, bool= false);
	static bool readString(istream&, string&, bool= false);
	static bool readInt(istream&, int&, bool= false);
	static bool readInt(istream&, uint64_t&, bool= false);
	static bool verify(istream&, char c, bool=false);

	// other stuff
	static bool prefix(string&, string&);	
	static int strnlen(char*, int);
	static void genPerm(int, int*);	
	static uint32_t getTime();
	static void warning(const string&);
	static void fatal(const string&);

	// convenience functions for random number generation
	// Should eventually replace with C++11 <random> variants
	static double randfrac();
	static int randint(int, int);
	static double randexp(double);
	static int randgeo(double);
	static int randTruncGeo(double, int);
	static double randpar(double, double);
};

inline void Util::warning(const string& msg) {
	cerr << "Warning: " << msg << endl;
}

inline void Util::fatal(const string& msg) {
	cerr << "Fatal: " << msg << endl;
	if (errno != 0) perror("");
	exit(1);
}


/** Generate a random fraction.
 *  @return a double in [0,1]
 */
inline double Util:: randfrac() { return ((double) random())/BIGINT32; }

/** Generate a random integer in a range.
 *  @param lo is the low end of the range
 *  @param hi is the high end of the range
 *  @return a random integer in [lo,hi]; the distribution is not
 *  very uniform for ranges larger than 10^7
 */
inline int Util::randint(int lo, int hi) {
	return lo + (random() % (hi + 1 - lo));
}

// Return a random number from an exponential distribution with mean mu 
inline double Util::randexp(double mu) { return -mu*log(randfrac()); }

/** Return a random number from a geometric distribution.
 *  @param p is success probability (so 1/p is mean)
 *  @return a random value from the distribution
 */
inline int Util::randgeo(double p) {
	return p > .999999 ? 1 :
		max(1,int(.999999 +log(randfrac())/log(1-p)));
}

/** Return a random number from a truncated geometric distribution with
 *  mean 1/p and maximum value k.
 */
inline int Util::randTruncGeo(double p, int k) {
	double x = 1 - exp((k-1)*log(1-p));
	int r = int(.999999+log(randfrac()/x)/log(1-p));
	return p > .999999 ? 1 : max(1,min(r,k));
}

/** Return a random number from a Pareto distribution with mean mu
 *  and shape s
 */
inline double Util::randpar(double mu, double s) {
	return mu*(1-1/s)/exp((1/s)*log(randfrac()));
}

} // ends namespace

#endif
