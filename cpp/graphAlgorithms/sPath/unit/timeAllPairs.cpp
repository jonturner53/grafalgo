/** @file timeAllPairs.cpp
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

namespace grafalgo {
extern void dijkstraAll(Wdigraph&, int**, vertex**);
extern void floyd(Wdigraph&, int**, vertex**);
}

using namespace chrono;
using namespace grafalgo;

/** usage: 
 * 	timeAllPairsRep method reps n m lo hi 
 * 
 *  allPairsRep repeated generates a random graph with the specified
 *  parameters and computes shortest paths with the specified method.
 *  Reps is the number of repetitions.
 * 
 *  If a graph has a negative length cycle, it prints an
 *  error message and halts.
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
	vertex u;
	int** dist; vertex** parent; vertex** mid;

	if (argc != 7 ||
	    sscanf(argv[2],"%d",&reps) != 1 ||
	    sscanf(argv[3],"%d",&n) != 1 ||
	    sscanf(argv[4],"%d",&m) != 1 ||
	    sscanf(argv[5],"%d",&lo) != 1  ||
	    sscanf(argv[6],"%d",&hi) != 1)
		Util::fatal("usage: allPairsRep method reps n m lo hi");
	
	if (strcmp(argv[1],"floyd") == 0) {
		dist = new int*[n+1];
		mid = new vertex*[n+1];
		for (u = 1; u <= n; u++) {
			dist[u] = new int[n+1];
			mid[u] = new vertex[n+1];
		}
	} else if (strcmp(argv[1],"dijkstra") == 0) {
		dist = new int*[n+1];
		parent = new vertex*[n+1];
		for (u = 1; u <= n; u++) {
			dist[u] = new int[n+1];
			parent[u] = new vertex[n+1];
		}
	} else {
		Util::fatal("allPairs: undefined method");
	}

	high_resolution_clock::time_point t1, t2;
	nanoseconds diff;
	int64_t avgTime, minTime, maxTime;
	avgTime = maxTime = 0; minTime = ((int64_t) 1) << 62;
	Wdigraph dig;
	for (i = 1; i <= reps; i++) {
		Rgraph::digraph(dig,n,m); Rgraph::setLengths(dig,lo,hi);
		if (strcmp(argv[1],"floyd") == 0) {
			t1 = high_resolution_clock::now();
			floyd(dig,dist,mid);
		} else if (strcmp(argv[1],"dijkstra") == 0) {
			t1 = high_resolution_clock::now();
			dijkstraAll(dig,dist,parent);
		}
		t2 = high_resolution_clock::now();
		diff = t2 - t1;
		avgTime += diff.count();
		minTime = min(minTime,diff.count());
		maxTime = max(maxTime,diff.count());
	}
	avgTime /= reps;
	cout << argv[1] << " " << n << " " << m << " " << lo << " " << hi
	     << " " << (avgTime/1000) << " " << (minTime/1000)
	     << " " << (maxTime/1000) << endl;
}
