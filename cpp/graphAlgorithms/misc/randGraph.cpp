// usage: randGraph type n m scram [..] seed
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
//    "ugraph"  n m scram seed
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
#include "Adt.h"
#include "Rgraph.h"
#include "Mflograph.h"

using namespace grafalgo;

int main(int argc, char* argv[]) {
	int n, m, mss, scram, lo, hi, ecap1, ecap2, seed;
	char *gtyp = argv[1];

	if (argc < 6 || argc > 11 ||
	    sscanf(argv[2],"%d",&n) != 1 ||
	    sscanf(argv[3],"%d",&m) != 1 ||
	    sscanf(argv[4],"%d",&scram) != 1 ||
	    sscanf(argv[argc-3],"%d",&lo) != 1 ||
	    sscanf(argv[argc-2],"%d",&hi) != 1 ||
	    sscanf(argv[argc-1],"%d",&seed) != 1)
		Util::fatal("usage: randGraph type n m scram [..] seed");
	if (argc >= 9 && (
	    sscanf(argv[5],"%d",&mss) != 1 ||
	    sscanf(argv[6],"%d",&ecap1) != 1 ||
	    sscanf(argv[7],"%d",&ecap2) != 1))
		Util::fatal("usage: randGraph type n m scram [..] seed");

	srandom(seed); string s;
	if (strcmp(gtyp,"ugraph") == 0 && argc == 6) {
		Graph g(n,m);
		Rgraph::ugraph(g,n,m);
		if (scram) Rgraph::scramble(g);
		cout << g;
	} else if (strcmp(gtyp,"bigraph") == 0 && argc == 6) {
		Graph bg(2*n,m);
		Rgraph::bigraph(bg,n,n,m);
		if (scram) Rgraph::scramble(bg);
		cout << bg;
	} else if (strcmp(gtyp,"cgraph") == 0 && argc == 6) {
		Graph cg(n,m);
		Rgraph::connected(cg,n,m);
		if (scram) Rgraph::scramble(cg);
		cout << cg;
	} else if (strcmp(gtyp,"tree") == 0 && argc == 6) {
		Graph tree(n,n-1);
		Rgraph::tree(tree,n);
		if (scram) Rgraph::scramble(tree);
		cout << tree;
	} else if (strcmp(gtyp,"wgraph") == 0 && argc == 8) {
		Wgraph wg(n,m);
		Rgraph::ugraph(wg,n,m);
		Rgraph::edgeWeight(wg,lo,hi);
		if (scram) Rgraph::scramble(wg);
		cout << wg;
	} else if (strcmp(gtyp,"wbigraph") == 0 && argc == 8) {
		Wgraph wbg(2*n,m);
		Rgraph::bigraph(wbg,n,n,m);
		Rgraph::edgeWeight(wbg,lo,hi);
		if (scram) Rgraph::scramble(wbg);
		cout << wbg;
	} else if (strcmp(gtyp,"wcgraph") == 0 && argc == 8) {
		Wgraph wcg(n,m);
		Rgraph::connected(wcg,n,m);
		Rgraph::edgeWeight(wcg,lo,hi);
		if (scram) Rgraph::scramble(wcg);
		cout << wcg;
	} else if (strcmp(gtyp,"wtree") == 0 && argc == 8) {
		Wgraph wtree(n,n-1);
		Rgraph::tree(wtree,n);
		Rgraph::edgeWeight(wtree,lo,hi);
		if (scram) Rgraph::scramble(wtree);
		cout << wtree;
	} else if (strcmp(gtyp,"digraph") == 0 && argc == 6) {
		Digraph dg(n,m);
		Rgraph::digraph(dg,n,m);
		if (scram) Rgraph::scramble(dg);
		cout << dg;
	} else if (strcmp(gtyp,"dag") == 0 && argc == 6) {
		Digraph dg(n,m);
		Rgraph::dag(dg,n,m);
		if (scram) Rgraph::scramble(dg);
		cout << dg;
	} else if (strcmp(gtyp,"wdigraph") == 0 && argc == 8) {
		Wdigraph wD(n,m);
		Rgraph::digraph(wD,n,m);
		Rgraph::edgeLength(wD,lo,hi);
		if (scram) Rgraph::scramble(wD);
		cout << wD;
	} else if (strcmp(gtyp,"wdag") == 0 && argc == 8) {
		Wdigraph waD(n,m);
		Rgraph::dag(waD,n,m);
		Rgraph::edgeLength(waD,lo,hi);
		if (scram) Rgraph::scramble(waD);
		cout << waD;
	} else if (strcmp(gtyp,"flograph") == 0 && argc == 9) {
		Flograph fg(n,m,1,2);
		Rgraph::flograph(fg,n,m,mss);
		Rgraph::edgeCapacity(fg,ecap1,ecap2);
		if (scram) Rgraph::scramble(fg);
		cout << fg;
	} else if (strcmp(gtyp,"wflograph") == 0 && argc == 11) {
		Wflograph wfg(n,m,1,2);
		Rgraph::flograph(wfg,n,m,mss);
		Rgraph::edgeCapacity(wfg,ecap1,ecap2);
		Rgraph::edgeCost(wfg,lo,hi);
		if (scram) Rgraph::scramble(wfg);
		cout << wfg;
	} else if (strcmp(gtyp,"mflograph") == 0 && argc == 11) {
		Mflograph mfg(n,m,1,2);
		Rgraph::flograph(mfg,n,m,mss);
		Rgraph::edgeCapacity(mfg,ecap1,ecap2);
		Rgraph::edgeMinFlo(mfg,lo,hi);
		if (scram) Rgraph::scramble(mfg);
		cout << mfg;
	} else 
		Util::fatal("usage: randGraph type n m scram [..] seed");
	exit(0);
}
