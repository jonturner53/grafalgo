// usage:
//	sptRep method reps n m lo hi
//
// sptRep repeatedly generates a random graph and computes
// its shortest path tree using the specified method.
// Reps is the number of repetitions.
// n is the number of vertices, m is the number of edges
// [lo,hi] is the range of edge lengths
//

#include "stdinc.h"
#include "Wdigraph.h"
#include "Rgraph.h"

using namespace grafalgo;

extern void dijkstra(Wdigraph&, vertex, vertex*, int*);
extern void bfScan(Wdigraph&, vertex, vertex*, int*);

int main(int argc, char *argv[]) {
	int i, reps, n, m, lo, hi;

	if (argc != 7 ||
	    sscanf(argv[2],"%d",&reps) != 1 ||
	    sscanf(argv[3],"%d",&n) != 1 ||
	    sscanf(argv[4],"%d",&m) != 1 ||
	    sscanf(argv[5],"%d",&lo) != 1 ||
	    sscanf(argv[6],"%d",&hi) != 1)
		Util::fatal("usage: mstRep method reps n m span lo hi");

	vertex *p = new vertex[n+1]; vertex *d = new vertex[n+1];
	Wdigraph dig; Wdigraph *sptree;
	for (i = 1; i <= reps; i++) {
		Rgraph::digraph(dig,n,m); 
		Rgraph::edgeLength(dig,lo,hi);
		sptree = new Wdigraph(dig.n(),dig.n()-1);
		if (strcmp(argv[1],"dijkstra") == 0)
			dijkstra(dig,1,p,d);
		else if (strcmp(argv[1],"bfScan") == 0)
			bfScan(dig,1,p,d);
		else
			Util::fatal("sptRep: undefined method");
		delete sptree;
	}
}
