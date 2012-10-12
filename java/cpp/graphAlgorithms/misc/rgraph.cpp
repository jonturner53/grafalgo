// usage: rgraph type n m scram [..] seed
//
// Create a random graph on n vertices and m edges
// and print it. Type specifies what type of graph
// to generate (see below). Span is the max separation
// between vertices in the same edge. Scramble=1 if
// vertex numbers should be randomized, otherwise 0.
// Certain cases require additional arguments that are detailed
// below, along with the string that specifies the
// graph type.
// 
//     "graph"  n m scram seed
//   "bigraph"  n m scram seed
//    "cgraph"  n m scram seed
//      "tree"  n m scram seed
//    "wgraph" 	n m scram lo hi seed
//  "wbigraph"  n m scram lo hi seed
//   "wcgraph"  n m scram lo hi seed
//     "wtree"  n m scram seed
//   "digraph"  n m scram seed
//       "dag"  n m scram seed
//  "wdigraph" 	n m scram lo hi seed
//      "wdag" 	n m scram lo hi seed
//  "flograph"  n m scram mss ecap1 ecap2 seed
// "wflograph" 	n m scram mss ecap1 ecap2 lo hi seed
// "mflograph" 	n m scram mss ecap1 ecap2 lo hi seed
//
// For bigraphs, n is the number of vertices in each part.
// For weighted graphs, [lo,hi] is the range of edge
// weights. These are distributed uniformly in the range.
// For flographs, mss is the number of edges from the source
// and to the sink, ecap1 is the average edge capacity of
// source/sink edges and ecap2 is the average edge capacity
// of all other edges.

#include "stdinc.h"
#include "Wgraph.h"
#include "Wdigraph.h"
#include "Wflograph.h"
#include "Mflograph.h"

//extern void rdigraph(int, int, int, bool, Digraph&);
//extern void randLeng(int, int, Wdigraph&);
//extern void rflograph(int, int, int, bool, Flograph&);

main(int argc, char* argv[]) {
	int i, n, m, mss, scram, lo, hi, ecap1, ecap2, seed;
	char *gtyp = argv[1];

	if (argc < 6 || argc > 11 ||
	    sscanf(argv[2],"%d",&n) != 1 ||
	    sscanf(argv[3],"%d",&m) != 1 ||
	    sscanf(argv[4],"%d",&scram) != 1 ||
	    sscanf(argv[argc-3],"%d",&lo) != 1 ||
	    sscanf(argv[argc-2],"%d",&hi) != 1 ||
	    sscanf(argv[argc-1],"%d",&seed) != 1)
		fatal("usage: rgraph type n m scram [..] seed");
	if (argc >= 9 && (
	    sscanf(argv[5],"%d",&mss) != 1 ||
	    sscanf(argv[6],"%d",&ecap1) != 1 ||
	    sscanf(argv[7],"%d",&ecap2) != 1))
		fatal("usage: rgraph type n m scram [..] seed");

	srandom(seed); string s;
	if (strcmp(gtyp,"graph") == 0 && argc == 6) {
		Graph g(n,m);
		g.rgraph(n,m);
		if (scram) g.scramble();
		cout << g.toString(s);
	} else if (strcmp(gtyp,"bigraph") == 0 && argc == 6) {
		Graph bg(2*n,m);
		bg.rbigraph(n,m);
		if (scram) bg.scramble();
		cout << bg.toString(s);
	} else if (strcmp(gtyp,"cgraph") == 0 && argc == 6) {
		Graph cg(n,m);
		cg.rcgraph(n,m);
		if (scram) cg.scramble();
		cout << cg.toString(s);
	} else if (strcmp(gtyp,"tree") == 0 && argc == 6) {
		Graph tree(n,n-1);
		tree.rtree(n);
		if (scram) tree.scramble();
		cout << tree.toString(s);
	} else if (strcmp(gtyp,"wgraph") == 0 && argc == 8) {
		Wgraph wg(n,m);
		wg.rgraph(n,m);
		wg.randWeight(lo,hi);
		if (scram) wg.scramble();
		cout << wg.toString(s);
	} else if (strcmp(gtyp,"wbigraph") == 0 && argc == 8) {
		Wgraph wbg(2*n,m);
		wbg.rbigraph(n,m);
		wbg.randWeight(lo,hi);
		if (scram) wbg.scramble();
		cout << wbg.toString(s);
	} else if (strcmp(gtyp,"wcgraph") == 0 && argc == 8) {
		Wgraph wcg(n,m);
		wcg.rcgraph(n,m);
		wcg.randWeight(lo,hi);
		if (scram) wcg.scramble();
		cout << wcg.toString(s);
	} else if (strcmp(gtyp,"wtree") == 0 && argc == 8) {
		Wgraph wtree(n,n-1);
		wtree.rtree(n);
		wtree.randWeight(lo,hi);
		if (scram) wtree.scramble();
		cout << wtree.toString(s);
	} else if (strcmp(gtyp,"digraph") == 0 && argc == 6) {
		Digraph dg(n,m);
		dg.rgraph(n,m);
		if (scram) dg.scramble();
		cout << dg.toString(s);
	} else if (strcmp(gtyp,"dag") == 0 && argc == 6) {
		Digraph dag(n,m);
		dag.rdag(n,m);
		if (scram) dag.scramble();
		cout << dag.toString(s);
	} else if (strcmp(gtyp,"wdigraph") == 0 && argc == 8) {
		Wdigraph wD(n,m);
		wD.rgraph(n,m);
		wD.randLength(lo,hi);
		if (scram) wD.scramble();
		cout << wD.toString(s);
	} else if (strcmp(gtyp,"wdag") == 0 && argc == 8) {
		Wdigraph waD(n,m);
		waD.rdag(n,m);
		waD.randLength(lo,hi);
		if (scram) waD.scramble();
		cout << waD.toString(s);
	} else if (strcmp(gtyp,"flograph") == 0 && argc == 9) {
		Flograph fg(n,m,1,2);
		fg.rgraph(n,m,mss);
		fg.randCapacity(ecap1,ecap2);
		if (scram) fg.scramble();
		cout << fg.toString(s);
	} else if (strcmp(gtyp,"wflograph") == 0 && argc == 11) {
		Wflograph wfg(n,m,1,2);
		wfg.rgraph(n,m,mss);
		wfg.randCapacity(ecap1,ecap2);
		wfg.randCost(lo,hi);
		if (scram) wfg.scramble();
		cout << wfg.toString(s);
	} else if (strcmp(gtyp,"mflograph") == 0 && argc == 11) {
		Mflograph mfg(n,m,1,2);
		mfg.rgraph(n,m,mss);
		mfg.randCapacity(ecap1,ecap2);
		mfg.randMinFlo(lo,hi);
		if (scram) mfg.scramble();
		cout << mfg.toString(s);
	} else 
		fatal("usage: rgraph type n m scram [..] seed");
}
