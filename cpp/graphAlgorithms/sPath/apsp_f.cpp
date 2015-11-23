#include "stdinc.h"
#include "Graph_wd.h"

namespace grafalgo {

/** Compute a solution to the all pairs shortest path problem
 *  using Floyd's algorithm.
 *  @param g is a digraph with edge lengths
 *  @param dist is a 2d array used to return the inter-vertex distances;
 *  specifically, dist[u][v] is the distance from u to v on return
 *  @param mid is a 2d array that defines intermediate points of inter-vertex
 *  paths, specifically, mid[u][v] is an intermediate point of a
 *  shortest u-v path; complete paths can be extracted from mid using
 *  a simple recursive procedure
 *  @return false if the graph contains a negative cycle
 */
bool apsp_f(Graph_wd& g, edgeLength* dist[], vertex* mid[]) {
	vertex u,v,w; edge e;

	// Initialize dist and mid.
	for (u = 1; u <= g.n(); u++) {
		for (v = 1; v <= g.n(); v++) {
			if (u == v) dist[u][v] = 0;
			else dist[u][v] = INT_MAX;
			mid[u][v] = 0;
		}
	}
	for (e = g.first(); e != 0; e = g.next(e)) {
		u = g.tail(e); v = g.head(e);
		dist[u][v] = g.length(e);
	}

	// Compute distances.
	for (v = 1; v <= g.n(); v++) {
		if (dist[v][v] < 0) return false;
		for (u = 1; u <= g.n(); u++) {
			for (w = 1; w <= g.n(); w++) {
				if (dist[u][v] != INT_MAX &&
				    dist[v][w] != INT_MAX &&
				    dist[u][w] > dist[u][v] + dist[v][w]) {
					dist[u][w] = dist[u][v] + dist[v][w];
					mid[u][w] = v;	
				}
			}
		}
	}
	return true;
}

} // ends namespace
