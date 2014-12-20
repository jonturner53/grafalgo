/** @file timeMst.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include <sys/times.h>
#include <unistd.h>
#include <chrono>
#include "Glist.h"
#include "Wgraph.h"
#include "Rgraph.h"
#include "Util.h"

using namespace grafalgo;
using namespace chrono;

extern void kruskal(Wgraph&, Glist<int>&);
extern void prim(Wgraph&, Glist<int>&);
extern void primF(Wgraph&, Glist<int>&);
extern void cheritonTarjan(Wgraph&, Glist<int>&);

/** usage:
 * 	timeMst method reps n m maxkey
 * 
 *  timeMst repeatedly generates a random graph and computes
 *  its minimum spanning tree using the specified method.
 *  Reps is the number of repetitions.
 *  n is the number of vertices, m is the number of edges,
 *  maxkey is the maximum key
 * 
 *  Method may be prim, primF, kruskal or cheritonTarjan.
 * 
 *  The output is a single line containing
 *
 *      method n m maxkey avg min max
 *
 *  where avg is the average time required to execute the specified
 *  method, min is the minimum time and max in the maximum time.
 */
int main(int argc, char* argv[]) {
	int i, reps, n, m, maxkey;
	if (argc != 6 ||
	    sscanf(argv[2],"%d",&reps) != 1 ||
	    sscanf(argv[3],"%d",&n) != 1 ||
	    sscanf(argv[4],"%d",&m) != 1 ||
	    sscanf(argv[5],"%d",&maxkey) != 1) {
		Util::fatal("usage: timeMst method reps n m maxkey");
		exit(1); // redundant exit to shutup compiler
	}

	srand(1);
	Wgraph wg(n,m);
	Glist<edge> mstree;
	high_resolution_clock::time_point time1, time2;
	nanoseconds diff;
	int64_t avgTime, minTime, maxTime;
	avgTime = maxTime = 0; minTime = ((int64_t) 1) << 62;
	for (i = 1; i <= reps; i++) {
		Rgraph::connected(wg,n,m); 
		Rgraph::setWeights(wg,0,maxkey);

		if (strcmp(argv[1],"kruskal") == 0) {
			time1 = high_resolution_clock::now();
			kruskal(wg,mstree);
		} else if (strcmp(argv[1],"prim") == 0) {
			time1 = high_resolution_clock::now();
			prim(wg,mstree);
		} else if (strcmp(argv[1],"primF") == 0) {
			time1 = high_resolution_clock::now();
			primF(wg,mstree);
		} else if (strcmp(argv[1],"cheritonTarjan") == 0) {
			time1 = high_resolution_clock::now();
			cheritonTarjan(wg,mstree);
		} else {
			Util::fatal("mstRep: undefined method");
		}
		time2 = high_resolution_clock::now();
		diff = time2 - time1;
		avgTime += diff.count();
		minTime = min(diff.count(),minTime);
		maxTime = max(diff.count(),maxTime);
		mstree.clear();
	}
	avgTime /= reps;
	cout << argv[1] << " " << n << " " << m << " " << maxkey << " "
	     << (avgTime/1000) << " " << (minTime/1000) << " "
	     << (maxTime/1000) << endl;
}
