// usage: mst method
//
// mst reads a graph from stdin, computes its minimum spanning tree
// using the method specified by the argument and then prints the graph
// and the mst.
//

#include "stdinc.h"
#include "Wgraph.h"

extern void kruskal(Wgraph&, Wgraph&);
extern void prim(Wgraph&, Wgraph&);
extern void primF(Wgraph&, Wgraph&);
extern void rrobin(Wgraph&, Wgraph&);

main(int argc, char *argv[]) {
	Wgraph wg; wg.read(cin);
	Wgraph mstree(wg.n(),wg.n()-1);
	
	if (argc < 2) fatal("usage: mst method ..");

	int t1 = Util::getTime();
	if (strcmp(argv[1],"kruskal") == 0) {
		kruskal(wg,mstree);
	} else if (strcmp(argv[1],"prim") == 0)
		prim(wg,mstree);
	else if (strcmp(argv[1],"primF") == 0)
		primF(wg,mstree);
	else if (strcmp(argv[1],"rrobin") == 0)
		rrobin(wg,mstree);
	else
		fatal("mst: undefined method");
	int t2 = Util::getTime();


	string s1, s2;
	cout << wg.toString(s1) << endl << mstree.toString(s2);
	int cost = 0;
	for (edge e = mstree.first(); e != 0; e = mstree.next(e))
		cost += mstree.weight(e);
	cout << "\ntree cost: " << cost << endl;
	cout << "\nelapsed time: " << (t2-t1) << " us" << endl;
	exit(0);
}
