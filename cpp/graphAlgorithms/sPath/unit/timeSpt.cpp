/** @file timeSpt.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include <chrono>
#include "stdinc.h"
#include "Wdigraph.h"
#include "Rgraph.h"

using namespace grafalgo;
using namespace chrono;

extern void dijkstra(Wdigraph&, vertex, vertex*, int*);
extern void bfScan(Wdigraph&, vertex, vertex*, int*);

/** usage:
 * 	sptRep method reps n m lo hi
 * 
 *  sptRep repeatedly generates a random graph and computes
 *  its shortest path tree using the specified method.
 *  Reps is the number of repetitions.
 *  n is the number of vertices, m is the number of edges
 *  [lo,hi] is the range of edge lengths
 *
 *  The output is a single line containing
 *
 *       method n m lo hi avg min max
 *
 *  where avg is the average time to execute the specified method
 *  in microseconds, min is the minimum time, max is the maximum time.
 */ 
int main(int argc, char *argv[]) {
	int i, reps, n, m, lo, hi;

	if (argc != 7 ||
	    sscanf(argv[2],"%d",&reps) != 1 ||
	    sscanf(argv[3],"%d",&n) != 1 ||
	    sscanf(argv[4],"%d",&m) != 1 ||
	    sscanf(argv[5],"%d",&lo) != 1 ||
	    sscanf(argv[6],"%d",&hi) != 1) {
		Util::fatal("usage: timeSpt method reps n m lo hi");
		exit(1); // redundant exit to shutup compiler
	}

	vertex *p = new vertex[n+1]; vertex *d = new vertex[n+1];
	Wdigraph dig; Wdigraph *sptree;
	high_resolution_clock::time_point t1, t2;
	nanoseconds diff;
	int64_t avgTime, minTime, maxTime;
	avgTime = maxTime = 0; minTime = ((int64_t) 1) << 62;
	for (i = 1; i <= reps; i++) {
		Rgraph::digraph(dig,n,m); 
		Rgraph::setLengths(dig,lo,hi);
		sptree = new Wdigraph(dig.n(),dig.n()-1);
		if (strcmp(argv[1],"dijkstra") == 0) {
			t1 = high_resolution_clock::now();
			dijkstra(dig,1,p,d);
		} else if (strcmp(argv[1],"bfScan") == 0) {
			t1 = high_resolution_clock::now();
			bfScan(dig,1,p,d);
		} else {
			Util::fatal("sptRep: undefined method");
		}
		t2 = high_resolution_clock::now();
		diff = t2 - t1;
		avgTime += diff.count();
		minTime = min(minTime, diff.count());
		maxTime = max(maxTime, diff.count());
		delete sptree;
	}
	avgTime /= reps;
	cout << argv[1] << " " << n << " " << m << " " << lo << " " << hi 
	     << " " << (avgTime/1000) << " " << (minTime/1000)
	     << " " << (maxTime/1000) << endl;
}
