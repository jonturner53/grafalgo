/** @file dijkstraAll.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Wdigraph.h"

namespace grafalgo {

extern void dijkstra(Wdigraph&, vertex, edge*, edgeLength*);
extern bool bfScan(Wdigraph&, vertex, edge*, edgeLength*);

/** Compute a solution to the all pairs shortest path problem
 *  using Dijkstra's algorithm, with transformed edge lengths.
 *  @param dig is a directed graph
 *  @param dist is a 2d array used to return the distances;
 *  specifically, dist[u][v]=distance from u to v
 *  @param pEdge is a 2d array used to return the parent information;
 *  pEdge[u][v] is the number of edge to the parent of v in the
 *  shortest path tree rooted at u.
 *  @return false if a negative cycle is detected
 */
bool dijkstraAll(Wdigraph& dig, edgeLength* dist[], edge* pEdge[]) {
	// Compute distances in augmented graph.
	vertex p1[dig.n()+1];
	edgeLength d1[dig.n()+1];
	if (!bfScan(dig,0,p1,d1)) return false;

	// Modify edge costs.
	for (edge e = dig.first(); e != 0; e = dig.next(e)) {
		vertex u = dig.tail(e); vertex v = dig.head(e);
		dig.setLength(e,dig.length(e)+(d1[u]-d1[v]));
	}

	// Compute shortest paths & put inverse-transformed distances in dist.
	edge pEdge2[dig.n()+1];
	edgeLength d2[dig.n()+1];
	for (vertex u = 1; u <= dig.n(); u++) {
		dijkstra(dig,u,pEdge2,d2);
		for (vertex v = 1; v <= dig.n(); v++) {
			dist[u][v] = d2[v]-(d1[u]-d1[v]);
			pEdge[u][v] = pEdge2[v];
		}
	}

	// Restore original edge costs.
	for (edge e = 1; e <= dig.m(); e++) {
		vertex u = dig.tail(e); vertex v = dig.head(e);
		dig.setLength(e,dig.length(e)-(d1[u]-d1[v]));
	}
	return true;
}

} // ends namespace
