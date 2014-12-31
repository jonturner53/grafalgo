#include "stdinc.h"
#include "Wdigraph.h"

namespace grafalgo {

/** Compute a solution to the all pairs shortest path problem
 *  using Floyd's algorithm.
 *  @param dig is a digraph with edge lengths
 *  @param dist is a 2d array used to return the inter-vertex distances;
 *  specifically, dist[u][v] is the distance from u to v on return
 *  @param mid is a 2d array that defines intermediate points of inter-vertex
 *  paths, specifically, mid[u][v] is an intermediate point of a
 *  shortest u-v path; complete paths can be extracted from mid using
 *  a simple recursive procedure
 *  @return false if the graph contains a negative cycle
 */
bool floyd(Wdigraph& dig, edgeLength* dist[], vertex* mid[]) {
	vertex u,v,w; edge e;

	// Initialize dist and mid.
	for (u = 1; u <= dig.n(); u++) {
		for (v = 1; v <= dig.n(); v++) {
			if (u == v) dist[u][v] = 0;
			else dist[u][v] = INT_MAX;
			mid[u][v] = 0;
		}
	}
	for (e = dig.first(); e != 0; e = dig.next(e)) {
		u = dig.tail(e); v = dig.head(e);
		dist[u][v] = dig.length(e);
	}

	// Compute distances.
	for (v = 1; v <= dig.n(); v++) {
		if (dist[v][v] < 0) return false;
		for (u = 1; u <= dig.n(); u++) {
			for (w = 1; w <= dig.n(); w++) {
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
