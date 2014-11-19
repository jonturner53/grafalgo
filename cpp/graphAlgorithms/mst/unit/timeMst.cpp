// usage:
//	timeMst method reps n m maxkey
//
// timeMst repeatedly generates a random graph and computes
// its minimum spanning tree using the specified method.
// Reps is the number of repetitions.
// n is the number of vertices, m is the number of edges,
// maxkey is the maximum key
//
// Method may be prim, primF, kruskal or rrobin.

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
extern void rrobin(Wgraph&, Glist<int>&);

int main(int argc, char* argv[]) {
	int i, reps, n, m, maxkey;
	high_resolution_clock::time_point time1, time2;
	nanoseconds maxtime(0), mintime(2000000000), totaltime(0);
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
	for (i = 1; i <= reps; i++) {
		Rgraph::connected(wg,n,m); 
		Rgraph::edgeWeight(wg,0,maxkey);

		if (strcmp(argv[1],"kruskal") == 0) {
			time1 = high_resolution_clock::now();
			kruskal(wg,mstree);
		} else if (strcmp(argv[1],"prim") == 0) {
			time1 = high_resolution_clock::now();
			prim(wg,mstree);
		} else if (strcmp(argv[1],"primF") == 0) {
			time1 = high_resolution_clock::now();
			primF(wg,mstree);
		} else if (strcmp(argv[1],"rrobin") == 0) {
			time1 = high_resolution_clock::now();
			rrobin(wg,mstree);
		} else {
			Util::fatal("mstRep: undefined method");
		}
		time2 = high_resolution_clock::now();
		mstree.clear();
		nanoseconds diff = time2 - time1;
		mintime = min(diff,mintime);
		maxtime = max(diff,maxtime);
		totaltime += diff;
	}
	double avgtime = (totaltime.count()/reps);
	cout << argv[1] << " n=" << n << " m=" << m
	     << " maxkey=" << maxkey << " "
	     << "avgtime=" << (avgtime/1000) << "us  "
	     << "mintime=" << (mintime.count()/1000) << "us  "
	     << "maxtime=" << (maxtime.count()/1000) << "us" << endl;
}
