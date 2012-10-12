#include "stdinc.h"
#include "Wdigraph.h"

void floyd(Wdigraph& dig, int* dist[], vertex* mid[]) {
// Compute a solution to the all pairs shortest path problem
// using Floyd's algorithm. Return dist[u][v]=distance from u to v
// and mid[u][v]=an intermediate mid-point of the shortest u-v path.

	vertex u,v,w; edge e;

	// Initialize dist and mid.
	for (u = 1; u <= dig.n(); u++) {
		for (v = 1; v <= dig.n(); v++) {
			if (u == v) dist[u][v] = 0;
			else dist[u][v] = BIGINT;
			mid[u][v] = 0;
		}
	}
	for (u = 1; u <= dig.n(); u++) {
		for (e = dig.firstOut(u); e != 0; e = dig.nextOut(u,e)) {
			v = dig.head(e);
			dist[u][v] = dig.length(e);
		}
	}

	// Compute distances.
	for (v = 1; v <= dig.n(); v++) {
		if (dist[v][v] < 0) fatal("floyd: negative cycle");
		for (u = 1; u <= dig.n(); u++) {
			for (w = 1; w <= dig.n(); w++) {
				if (dist[u][v] != BIGINT && dist[v][w] != BIGINT
				    && dist[u][w] > dist[u][v] + dist[v][w]) {
					dist[u][w] = dist[u][v] + dist[v][w];
					mid[u][w] = v;	
				}
			}
		}
	}
}
