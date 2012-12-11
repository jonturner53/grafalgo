// usage:
//	mstRep method reps n m maxkey
//
// mstRep repeatedly generates a random graph and computes
// its minimum spanning tree using the specified method.
// Reps is the number of repetitions.
// n is the number of vertices, m is the number of edges,
// maxkey is the maximum key
//

#include "stdinc.h"
#include <sys/times.h>
#include <unistd.h>
#include "Wgraph.h"
#include "Util.h"

using namespace grafalgo;

extern void kruskal(Wgraph&, Wgraph&);
extern void prim(Wgraph&, Wgraph&);
extern void primF(Wgraph&, Wgraph&);
extern void rrobin(Wgraph&, Wgraph&);

int main(int argc, char* argv[]) {
	int i, reps, n, m, maxkey;
	int time1, time2, maxtime, mintime, totaltime;
	if (argc != 6 ||
	    sscanf(argv[2],"%d",&reps) != 1 ||
	    sscanf(argv[3],"%d",&n) != 1 ||
	    sscanf(argv[4],"%d",&m) != 1 ||
	    sscanf(argv[5],"%d",&maxkey) != 1)
		Util::fatal("usage: mstRep method reps n m maxkey");

	srand(1);
	Wgraph wg(n,m), *mstree;
	mintime = Util::BIGINT32; maxtime = 0; totaltime = 0;
	for (i = 1; i <= reps; i++) {
		wg.rcgraph(n,m); 
		wg.randWeight(0,maxkey);
		mstree = new Wgraph(n,n-1);

		if (strcmp(argv[1],"kruskal") == 0) {
			time1 = Util::getTime();
			kruskal(wg,*mstree);
		} else if (strcmp(argv[1],"prim") == 0) {
			time1 = Util::getTime();
			prim(wg,*mstree);
		} else if (strcmp(argv[1],"primF") == 0) {
			time1 = Util::getTime();
			primF(wg,*mstree);
		} else if (strcmp(argv[1],"rrobin") == 0) {
			time1 = Util::getTime();
			rrobin(wg,*mstree);
		} else {
			Util::fatal("mstRep: undefined method");
		}
		time2 = Util::getTime();
		if (time1 == -1 || time2 == -1) {
			Util::fatal("mstRep: can't read time values");
		}
		clock_t diff = time2 - time1;
		mintime = min(diff,mintime);
		maxtime = max(diff,maxtime);
		totaltime += diff;
		delete mstree;
	}
	double avgtime = ((double) totaltime/reps);
	cout << "avgtime=" << avgtime << " us  ";
	cout << "mintime=" << mintime << " us  ";
	cout << "maxtime=" << maxtime << " us" << endl;
}
