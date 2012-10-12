#include "stdinc.h"
#include "Wdigraph.h"

extern void dijkstra(Wdigraph&, vertex, vertex*, int*);
extern void bfScan(Wdigraph&, vertex, vertex*, int*);

void dijkstraAll(Wdigraph& dig, int* dist[], vertex* parent[]) {
// Compute a solution to the all pairs shortest path problem
// using Dijkstra's algorithm, with transformed edge lengths.
// Return dist[u][v]=distance from u to v and 
// parent[u][v]=parent of v in the shortest path tree rooted at u.

	vertex u,v; edge e;

	// Compute distances in augmented graph.
	vertex* p1 = new vertex[dig.n()+1];
	int* d1 = new int[dig.n()+1];
	bfScan(dig,1,p1,d1);

	// Modify edge costs.
	for (e = dig.first(); e != 0; e = dig.next(e)) {
		u = dig.tail(e); v = dig.head(e);
		dig.setLength(e,dig.length(e)+(d1[u]-d1[v]));
	}

	// Compute shortest paths & put inverse-transformed distances in dist.
	vertex* p2 = new vertex[dig.n()+1];
	int* d2 = new int[dig.n()+1];
	for (u = 1; u <= dig.n(); u++) {
		dijkstra(dig,u,p2,d2);
		for (v = 1; v <= dig.n(); v++) {
			dist[u][v] = d2[v]-(d1[u]-d1[v]);
			parent[u][v] = p2[v];
		}
	}

	// Restore original edge costs.
	for (e = 1; e <= dig.m(); e++) {
		u = dig.tail(e); v = dig.head(e);
		dig.setLength(e,dig.length(e)-(d1[u]-d1[v]));
	}

	delete [] d1; delete[] p1; delete[] d2; delete [] p2;
}
