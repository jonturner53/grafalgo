// usage: mst method
//
// mst reads a graph from stdin, computes its minimum spanning tree
// using the method specified by the argument and then prints the graph
// and the mst.
//

#include "stdinc.h"
#include "Wgraph.h"

using namespace grafalgo;

extern void kruskal(Wgraph&, list<edge>&);
extern void prim(Wgraph&, list<edge>&);
extern void primF(Wgraph&, list<edge>&);
extern void rrobin(Wgraph&, list<edge>&);

main(int argc, char *argv[]) {
	Wgraph wg; wg.read(cin);
	list<edge> mstree;
	
	if (argc < 2) Util::fatal("usage: mst method ..");

	if (strcmp(argv[1],"kruskal") == 0) {
		kruskal(wg,mstree);
	} else if (strcmp(argv[1],"prim") == 0)
		prim(wg,mstree);
	else if (strcmp(argv[1],"primF") == 0)
		primF(wg,mstree);
	else if (strcmp(argv[1],"rrobin") == 0)
		rrobin(wg,mstree);
	else
		Util::fatal("mst: undefined method");

	string s; cout << wg.elist2string(mstree,s) << endl;
	int treeweight = 0;
	for (edge e : mstree) treeweight += wg.weight(e)
	cout << "mst weight: " << weight << endl;
	
	exit(0);
}
