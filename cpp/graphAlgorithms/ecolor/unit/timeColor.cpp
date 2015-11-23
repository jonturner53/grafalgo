/** @file testColor.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include <chrono>
#include "stdinc.h"
#include "Rgraph.h"
#include "Glist.h"
#include "ecGabow.h"

namespace grafalgo {
extern int ecMatch(Graph&, int*);
extern int ecFmatch(Graph&, int*);
extern int ecVizing(Graph&, int*);
}

using namespace chrono;
using namespace grafalgo;

/** usage: timeColor method reps n m
 * 
 *  TimeColor repeated generates a random graph and computes an edge coloring
 *  using the specified method.
 * 
 *  Methods currently implemented include match, fmatch, vizing and gabow.
 *
 *  Reps is the number of repetitions, n is the number of vertices,
 *  m is the number of edges
 *
 *  The output is a single line containing
 *
 *  method n m avg min max
 *
 *  where avg is the average time to compute the coloring, min is the
 *  minimum time, max is the maximum time
 */
int main(int argc, char *argv[]) {
	int reps, n, m;

	if (argc != 5 ||
	    sscanf(argv[2],"%d",&reps) != 1 ||
	    sscanf(argv[3],"%d",&n) != 1 ||
	    sscanf(argv[4],"%d",&m) != 1) {
		Util::fatal("usage: timeColor method reps n m");
		exit(1); // redundant exit to shutup compiler
	}

	Graph g(n,m); int color[m+1];
	high_resolution_clock::time_point t1, t2;
	nanoseconds diff;
	int64_t avgTime, minTime, maxTime;
	avgTime = maxTime = 0; minTime = ((int64_t) 1) << 62;
	for (int i = 1; i <= reps; i++) {
		Rgraph::ugraph(g,n,m);
		if (strcmp(argv[1],"match") == 0) {
			t1 = high_resolution_clock::now();
			ecMatch(g,color);
		} else if (strcmp(argv[1],"fmatch") == 0) {
			t1 = high_resolution_clock::now();
			ecFmatch(g,color);
		} else if (strcmp(argv[1],"vizing") == 0) {
			t1 = high_resolution_clock::now();
			ecVizing(g,color);
		} else if (strcmp(argv[1],"gabow") == 0) {
			t1 = high_resolution_clock::now();
			ecGabow(g,color);
		} else { 
			Util::fatal("match: invalid method");
		}
		t2 = high_resolution_clock::now();
		diff = t2 - t1;
		avgTime += diff.count();
		minTime = min(minTime,diff.count());
		maxTime = max(maxTime,diff.count());
	}
	avgTime /= reps;
	cout << argv[1];
	cout << " " << n << " " << m << " ";
	cout << (avgTime/1000) << " " << (minTime/1000) << " ";
	cout << (maxTime/1000) << endl;
}
