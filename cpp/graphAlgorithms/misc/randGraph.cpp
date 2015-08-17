/** @file randGraph.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Adt.h"
#include "Rgraph.h"
#include "Mflograph.h"
#include "GroupGraph.h"

using namespace grafalgo;

/** usage: randGraph type n m scram [..] seed
 * 
 *  Create a random graph on n vertices and m edges
 *  and print it. Type specifies what type of graph
 *  to generate (see below). Span is the max separation
 *  between vertices in the same edge. Scramble=1 if
 *  vertex numbers should be randomized, otherwise 0.
 *  Certain cases require additional arguments that are detailed
 *  below, along with the string that specifies the
 *  graph type.
 *  
 *     "ugraph"  n m seed scram
 *    "bigraph"  n m seed scram
 *     "cgraph"  n m seed scram
 *       "tree"  n seed scram
 *    "regular"  n d seed scram
 *  "biregular"  n d seed scram
 * "biregular2"  n1 n2 d1 seed scram
 *     "wgraph"  n m lo hi seed scram
 *   "wbigraph"  n m lo hi seed scram
 *    "wcgraph"  n m lo hi seed scram
 *      "wtree"  n seed scram
 *   "wregular"  n d lo hi seed scram
 * "wbiregular"  n d lo hi seed scram
 *    "digraph"  n m seed scram
 *        "dag"  n m seed scram
 *   "wdigraph"  n m lo hi seed scram
 *       "wdag"  n m lo hi seed scram
 *   "flograph"  n m mss ecap1 ecap2 seed scram
 *  "wflograph"  n m mss ecap1 ecap2 lo hi seed scram
 *  "mflograph"  n m mss ecap1 ecap2 lo hi seed scram
 * "groupgraph"  n1 n2 gc1 d2 k seed scram
 * 
 *  For bigraphs, n is the number of vertices in each part.
 *  For weighted graphs, [lo,hi] is the range of edge
 *  weights. These are distributed uniformly in the range.
 *  For flographs, mss is the number of edges from the source
 *  and to the sink, ecap1 is the average edge capacity of
 *  source/sink edges and ecap2 is the average edge capacity
 *  of all other edges.
 */
int main(int argc, char* argv[]) {
	int n, m, d, n1, n2, d1, d2, gc1, k,
	    mss, scram, lo, hi, ecap1, ecap2, seed;
	seed = 0;
	char *gtyp = argv[1];

	if (argc < 5 || argc > 11 ||
	    sscanf(argv[2],"%d",&n) != 1 ||
	    sscanf(argv[argc-2],"%d",&seed) != 1 ||
	    sscanf(argv[argc-1],"%d",&scram) != 1)
		Util::fatal("usage: randGraph type n [..] seed scram");

	srandom(seed); string s;
	if (strcmp(gtyp,"ugraph") == 0 && argc == 6 &&
	    sscanf(argv[3],"%d",&m) == 1) {
		Graph g(n,m);
		Rgraph::ugraph(g,n,m);
		if (scram) Rgraph::scramble<Graph>(g);
		cout << g;
	} else if (strcmp(gtyp,"bigraph") == 0 && argc == 6 &&
	    	   sscanf(argv[3],"%d",&m) == 1) {
		Graph g(2*n,m);
		Rgraph::bigraph(g,n,n,m);
		if (scram) Rgraph::scramble<Graph>(g);
		cout << g;
	} else if (strcmp(gtyp,"cgraph") == 0 && argc == 6 &&
	    	   sscanf(argv[3],"%d",&m) == 1) {
		Graph g(n,m);
		Rgraph::connected(g,n,m);
		if (scram) Rgraph::scramble<Graph>(g);
		cout << g;
	} else if (strcmp(gtyp,"tree") == 0 && argc == 5) {
		Graph g(n,n-1);
		Rgraph::tree(g,n);
		if (scram) Rgraph::scramble<Graph>(g);
		cout << g;
	} else if (strcmp(gtyp,"regular") == 0 && argc == 6 &&
	    	   sscanf(argv[3],"%d",&d) == 1) {
		Graph rg(n,n*d/2);
		Rgraph::regular(rg,n,d);
		if (scram) Rgraph::scramble<Graph>(rg);
		cout << rg;
	} else if (strcmp(gtyp,"biregular") == 0 && argc == 6 &&
	    	   sscanf(argv[3],"%d",&d) == 1) {
		Graph rg(n,n*d);
		Rgraph::regularBigraph(rg,n,d);
		if (scram) Rgraph::scramble<Graph>(rg);
		cout << rg;
	} else if (strcmp(gtyp,"biregular2") == 0 && argc == 7 &&
	    	   sscanf(argv[2],"%d",&n1) == 1 &&
	    	   sscanf(argv[3],"%d",&n2) == 1 &&
	    	   sscanf(argv[4],"%d",&d1) == 1) {
		Graph rg(n1+n2,n1*d1);
		Rgraph::regularBigraph(rg,n1,n2,d1);
		if (scram) Rgraph::scramble<Graph>(rg);
		cout << rg;
	} else if (strcmp(gtyp,"wgraph") == 0 && argc == 8 &&
	    	   sscanf(argv[3],"%d",&m) == 1 &&
	    	   sscanf(argv[4],"%d",&lo) == 1 &&
	    	   sscanf(argv[5],"%d",&hi) == 1) {
		Wgraph g(n,m);
		Rgraph::ugraph(g,n,m);
		Rgraph::setWeights(g,lo,hi);
		if (scram) Rgraph::scramble<Wgraph>(g);
		cout << g;
	} else if (strcmp(gtyp,"wbigraph") == 0 && argc == 8 &&
	    	   sscanf(argv[3],"%d",&m) == 1 &&
	    	   sscanf(argv[4],"%d",&lo) == 1 &&
	    	   sscanf(argv[5],"%d",&hi) == 1) {
		Wgraph g(2*n,m);
		Rgraph::bigraph(g,n,n,m);
		Rgraph::setWeights(g,lo,hi);
		if (scram) Rgraph::scramble<Wgraph>(g);
		cout << g;
	} else if (strcmp(gtyp,"wcgraph") == 0 && argc == 8 &&
	    	   sscanf(argv[3],"%d",&m) == 1 &&
	    	   sscanf(argv[4],"%d",&lo) == 1 &&
	    	   sscanf(argv[5],"%d",&hi) == 1) {
		Wgraph g(n,m);
		Rgraph::connected(g,n,m);
		Rgraph::setWeights(g,lo,hi);
		if (scram) Rgraph::scramble<Wgraph>(g);
		cout << g;
	} else if (strcmp(gtyp,"wtree") == 0 && argc == 7 &&
	    	   sscanf(argv[3],"%d",&lo) == 1 &&
	    	   sscanf(argv[4],"%d",&hi) == 1) {
		Wgraph g(n,n-1);
		Rgraph::tree(g,n);
		Rgraph::setWeights(g,lo,hi);
		if (scram) Rgraph::scramble<Wgraph>(g);
		cout << g;
	} else if (strcmp(gtyp,"wregular") == 0 && argc == 8 &&
	    	   sscanf(argv[3],"%d",&d) == 1 &&
	    	   sscanf(argv[4],"%d",&lo) == 1 &&
	    	   sscanf(argv[5],"%d",&hi) == 1) {
		Wgraph rg(n,n*d/2);
		Rgraph::regular(rg,n,d);
		Rgraph::setWeights(rg,lo,hi);
		if (scram) Rgraph::scramble<Graph>(rg);
		cout << rg;
	} else if (strcmp(gtyp,"wbiregular") == 0 && argc == 8 &&
	    	   sscanf(argv[3],"%d",&d) == 1 &&
	    	   sscanf(argv[4],"%d",&lo) == 1 &&
	    	   sscanf(argv[5],"%d",&hi) == 1) {
		Wgraph g(n,n*d);
		Rgraph::regularBigraph(g,n,d);
		Rgraph::setWeights(g,lo,hi);
		if (scram) Rgraph::scramble<Graph>(g);
		cout << g;
	} else if (strcmp(gtyp,"digraph") == 0 && argc == 6 &&
	    	   sscanf(argv[3],"%d",&m) == 1) {
		Digraph g(n,m);
		Rgraph::digraph(g,n,m);
		if (scram) Rgraph::scramble<Digraph>(g);
		cout << g;
	} else if (strcmp(gtyp,"dag") == 0 && argc == 6 &&
	    	   sscanf(argv[3],"%d",&m) == 1) {
		Digraph g(n,m);
		Rgraph::dag(g,n,m);
		if (scram) Rgraph::scramble<Digraph>(g);
		cout << g;
	} else if (strcmp(gtyp,"wdigraph") == 0 && argc == 8 &&
	    	   sscanf(argv[3],"%d",&m) == 1 &&
	    	   sscanf(argv[4],"%d",&lo) == 1 &&
	    	   sscanf(argv[5],"%d",&hi) == 1) {
		Wdigraph g(n,m);
		Rgraph::digraph(g,n,m);
		Rgraph::setLengths(g,lo,hi);
		if (scram) Rgraph::scramble<Wdigraph>(g);
		cout << g;
	} else if (strcmp(gtyp,"wdag") == 0 && argc == 8 &&
	    	   sscanf(argv[3],"%d",&m) == 1 &&
	    	   sscanf(argv[4],"%d",&lo) == 1 &&
	    	   sscanf(argv[5],"%d",&hi) == 1) {
		Wdigraph waD(n,m);
		Rgraph::dag(waD,n,m);
		Rgraph::setLengths(waD,lo,hi);
		if (scram) Rgraph::scramble<Wdigraph>(waD);
		cout << waD;
	} else if (strcmp(gtyp,"flograph") == 0 && argc == 9 &&
	    	   sscanf(argv[3],"%d",&m) == 1 &&
	    	   sscanf(argv[4],"%d",&mss) == 1 &&
	    	   sscanf(argv[5],"%d",&ecap1) == 1 &&
	    	   sscanf(argv[6],"%d",&ecap2) == 1) {
		Flograph g(n,m,1,2);
		Rgraph::flograph(g,n,m,mss);
		Rgraph::setCapacities(g,ecap1,ecap2);
		if (scram) Rgraph::scramble<Flograph>(g);
		cout << g;
	} else if (strcmp(gtyp,"wflograph") == 0 && argc == 11 &&
	    	   sscanf(argv[3],"%d",&m) == 1 &&
	    	   sscanf(argv[4],"%d",&mss) == 1 &&
	    	   sscanf(argv[5],"%d",&ecap1) == 1 &&
	    	   sscanf(argv[6],"%d",&ecap2) == 1 &&
	    	   sscanf(argv[7],"%d",&lo) == 1 &&
	    	   sscanf(argv[8],"%d",&hi) == 1) {
		Wflograph g(n,m,1,2);
		Rgraph::flograph(g,n,m,mss);
		Rgraph::setCapacities(g,ecap1,ecap2);
		Rgraph::setCosts(g,lo,hi);
		if (scram) Rgraph::scramble<Wflograph>(g);
		cout << g;
	} else if (strcmp(gtyp,"mflograph") == 0 && argc == 11 &&
	    	   sscanf(argv[3],"%d",&m) == 1 &&
	    	   sscanf(argv[4],"%d",&mss) == 1 &&
	    	   sscanf(argv[5],"%d",&ecap1) == 1 &&
	    	   sscanf(argv[6],"%d",&ecap2) == 1 &&
	    	   sscanf(argv[7],"%d",&lo) == 1 &&
	    	   sscanf(argv[8],"%d",&hi) == 1) {
		Mflograph g(n,m,1,2);
		Rgraph::flograph(g,n,m,mss);
		Rgraph::setCapacities(g,ecap1,ecap2);
		Rgraph::setMinFlows(g,lo,hi);
		if (scram) Rgraph::scramble<Mflograph>(g);
		cout << g;
	} else if (strcmp(gtyp,"groupgraph") == 0 && argc == 9 &&
	    	   sscanf(argv[2],"%d",&n1) == 1 &&
	    	   sscanf(argv[3],"%d",&n2) == 1 &&
	    	   sscanf(argv[4],"%d",&gc1) == 1 &&
	    	   sscanf(argv[5],"%d",&d2) == 1 &&
	    	   sscanf(argv[6],"%d",&k) == 1) {
		GroupGraph gg(n1+n2,n1*d1);
		Rgraph::groupGraph(gg,n1,n2,gc1,d2,k);
		if (scram) Rgraph::scramble<GroupGraph>(gg);
		cout << gg;
	} else 
		Util::fatal("usage: randGraph type n m scram [..] seed");
	exit(0);
}

