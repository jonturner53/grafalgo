// usage: 
//	allPairsRep method reps n p lo hi 
//
// allPairsRep repeated generates a random graph with the specified
// parameters and computes shortest paths with the specified method.
// Reps is the number of repetitions.
//
// If a graph has a negative length cycle, it prints an
// error message and halts.

#include "stdinc.h"
#include "Wdigraph.h"

using namespace grafalgo;

extern void dijkstraAll(Wdigraph&, int**, vertex**);
extern void floyd(Wdigraph&, int**, vertex**);

int main(int argc, char *argv[]) {
	int i, reps, n, m, lo, hi;
	vertex u; Wdigraph dig; 
	int** dist; vertex** parent; vertex** mid;

	if (argc != 7 ||
	    sscanf(argv[2],"%d",&reps) != 1 ||
	    sscanf(argv[3],"%d",&n) != 1 ||
	    sscanf(argv[4],"%d",&m) != 1 ||
	    sscanf(argv[5],"%d",&lo) != 1  ||
	    sscanf(argv[6],"%d",&hi) != 1)
		Util::fatal("usage: allPairsRep method reps n p lo hi");
	
	if (argc != 2) Util::fatal("usage: allPairs method");

	if (strcmp(argv[1],"floyd") == 0) {
		dist = new int*[dig.n()+1];
		mid = new vertex*[dig.n()+1];
		for (u = 1; u <= dig.n(); u++) {
			dist[u] = new int[dig.n()+1];
			mid[u] = new vertex[dig.n()+1];
		}
	} else if (strcmp(argv[1],"dijkstra") == 0) {
		dist = new int*[dig.n()+1];
		parent = new vertex*[dig.n()+1];
		for (u = 1; u <= dig.n(); u++) {
			dist[u] = new int[dig.n()+1];
			parent[u] = new vertex[dig.n()+1];
		}
	} else {
		Util::fatal("allPairs: undefined method");
	}

	for (i = 1; i <= reps; i++) {
		dig.rgraph(n,m); dig.randLength(lo,hi);
		if (strcmp(argv[1],"floyd") == 0) {
			floyd(dig,dist,mid);
		} else if (strcmp(argv[1],"dijkstra") == 0) {
			dijkstraAll(dig,dist,parent);
		}
	}
}
