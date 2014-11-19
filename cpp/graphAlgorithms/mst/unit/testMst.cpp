// usage: mst method
//
// mst reads a graph from stdin, computes its minimum spanning tree
// using the method specified by the argument and then prints the graph
// and the mst.
//

#include "stdinc.h"
#include "Glist.h"
#include "Wgraph.h"

using namespace grafalgo;

extern void kruskal(Wgraph&, Glist<edge>&);
extern void prim(Wgraph&, Glist<edge>&);
extern void primF(Wgraph&, Glist<edge>&);
extern void rrobin(Wgraph&, Glist<edge>&);

int main(int argc, char *argv[]) {
	Wgraph wg;
	cin >> wg;
	Glist<edge> mstree;
	
	if (argc < 2) Util::fatal("usage: mst method ..");

	if (strcmp(argv[1],"kruskal") == 0)
		kruskal(wg,mstree);
	else if (strcmp(argv[1],"prim") == 0)
		prim(wg,mstree);
	else if (strcmp(argv[1],"primF") == 0)
		primF(wg,mstree);
	else if (strcmp(argv[1],"rrobin") == 0)
		rrobin(wg,mstree);
	else
		Util::fatal("mst: undefined method");

	Wgraph mst(wg.n(), wg.n()-1);
	int treeweight = 0;
	for (grafalgo::index x = mstree.first(); x != 0; x = mstree.next(x)) {
		edge e = mstree.value(x);
		edge ee = mst.join(wg.left(e),wg.right(e));
		mst.setWeight(ee, wg.weight(e));
		treeweight += wg.weight(e);
	}
	cout << wg << endl << mst << endl;

	cout << "mst weight: " << treeweight << endl;
	
	exit(0);
}
