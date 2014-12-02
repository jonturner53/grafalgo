// usage:
//	matchRep {size|weight} {bipartite|general} method reps n m maxwt seed
//
// matchRep repeatedly generates a random graph and computes
// a matching using the specified method. When bipartite
// graphs are specified, it generates bipartite graphs.
//
// Reps is the number of repetitions.
// n is the number of vertices, p is the edge probability,
// maxwt is the maximum edge weight parameter.

#include "stdinc.h"
#include "Dlist.h"
#include "Wgraph.h"
#include "Rgraph.h"
#include "altPath.h"
#include "faltPath.h"
#include "edmonds.h"

using namespace grafalgo;

extern void flowMatch(Graph&,Dlist&,int&);
extern void flowMatch(Wgraph&,Dlist&,int&,int&);

int main(int argc, char* argv[]) {
	int i, reps, n, m, mSize, maxwt, seed;
	bool size, bipartite;
	Wgraph graf; Wgraph wg;
	Dlist *match;
	
	if (argc != 9 ||
	    sscanf(argv[4],"%d",&reps) != 1 ||
	    sscanf(argv[5],"%d",&n) != 1 ||
	    sscanf(argv[6],"%d",&m) != 1 ||
	    sscanf(argv[7],"%d",&maxwt) != 1 ||
	    sscanf(argv[8],"%d",&seed) != 1) {
		Util::fatal("usage: match {size|weight} {bipartite|general} "
		      "method reps n p maxwt seed");
		exit(1); // redundant exit to shutup compiler
	}

	if (strcmp(argv[1],"size") == 0)  size = true;
	else if (strcmp(argv[1],"weight") == 0)  size = false;
	else Util::fatal("usage: match {size|weight} {bipartite|general} method");

	if (strcmp(argv[2],"bipartite") == 0)  bipartite = true;
	else if (strcmp(argv[1],"general") == 0)  bipartite = false;
	else Util::fatal("usage: match {size|weight} {bipartite|general} method");

	srandom(seed);
	for (i = 1; i <= reps; i++) {
		match = new Dlist(m);
		if (size && bipartite) { 
			Rgraph::bigraph(graf,n,n,m);
			if (strcmp(argv[3],"altPath") == 0) {
				altPath(graf,*match,mSize);
			} else if (strcmp(argv[3],"faltPath") == 0) {
				faltPath(graf,*match,mSize);
			} else if (strcmp(argv[3],"flowMatch") == 0) {
				flowMatch(graf,*match,mSize);
			} else {
				Util::fatal("match: invalid method");
			}
		} else if (!size && bipartite) {
			Rgraph::bigraph(wg,n,n,m);
			Rgraph::edgeWeight(wg,0,maxwt);
			if (strcmp(argv[3],"flowMatch") == 0) {
				flowMatch(wg,*match,mSize,mSize);
			} else {
				Util::fatal("match: invalid method");
			}
		} else if (size & !bipartite) {
			Rgraph::ugraph(graf,n,m);
			if (strcmp(argv[3],"edmonds") == 0) {
				edmonds(graf,*match,mSize);
			} else {
				Util::fatal("match: invalid method");
			}
		} else { // no algorithms for other cases (yet)
			Util::fatal("match: invalid method");
		}
		delete match;
	}
}
