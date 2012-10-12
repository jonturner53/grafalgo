// usage: badCase n
//
// BadCase generates a weighted digraph that causes Dijkstra's
// shortest path algorithm to perform poorly, when
// started from vertex 1.
//
// The parameter n is the number of vertices.
//
// This program is not bullet-proof. Caveat emptor.

#include "stdinc.h"
#include "Wdigraph.h"

main(int argc, char* argv[]) {
	vertex u,v; edge e; int n;

	if (argc != 2 || sscanf(argv[1],"%d",&n) != 1)
		fatal("usage badCase n");

	Wdigraph dig(n,n*n/2);

	for (u = 1; u <= n-1; u++) {
		e = dig.join(u,u+1); dig.setLength(e,1);
		for (v = u+2; v <= n; v++) {
			e = dig.join(u,v); dig.setLength(e,2*(n-u));
		}
	}
	dig.sortAdjLists();
	string s;
	cout << dig.toString(s);
}
