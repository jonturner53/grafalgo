// usage: spt method [src]
//
// Spt reads a graph from stdin, computes a shortest path tree (from src)
// using the method specified by the argument and then prints the graph
// and the spt. Src defaults to 1.
//

#include "stdinc.h"
#include "Wdigraph.h"

using namespace grafalgo;

extern void dijkstra(Wdigraph&, vertex, vertex*, int*);
extern void bfScan(Wdigraph&, vertex, vertex*, int*);

int main(int argc, char *argv[]) {
	int s; Wdigraph dig; cin >> dig;
	
	s = 1;
	if (argc < 2 || argc > 3 ||
	    (argc == 3 && sscanf(argv[2],"%d",&s) != 1))
		Util::fatal("usage: spt method [src]");

	int *p = new vertex[dig.n()+1];
	int *d = new int[dig.n()+1];

	if (strcmp(argv[1],"dijkstra") == 0)
		dijkstra(dig,s,p,d);
	else if (strcmp(argv[1],"bfScan") == 0)
		bfScan(dig,s,p,d);
	else
		Util::fatal("spt: undefined method");

	Wdigraph sptree(dig.n(),dig.n()-1);
	int sum = 0;
	for (vertex u = 1; u <= dig.n(); u++) {
		if (p[u] != 0) {
			edge e = sptree.join(p[u],u);
			sptree.setLength(e,d[u]);
			sum += (d[u] - d[p[u]]);
		}
	}
	sptree.sortAdjLists();
	string s1;
	cout << dig.toString(s1) << endl;
	cout << sptree.toString(s1) << endl;
	cout << "total cost=" << sum << endl;
	delete [] p; delete [] d;
	exit(0);
}
