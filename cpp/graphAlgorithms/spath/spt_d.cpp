/** @file spt_d.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Heap_d.h"
#include "Graph_wd.h"

namespace grafalgo {

/** Find a shortest path tree using Dijkstra's algorithm.
 *  @param g is a directed graph with edge lengths
 *  @param s is the source vertex for the shortest path tree computation;
 *  if s=0, paths are computed from an imaginary extra vertex with a
 *  zero length edge to every other vertex
 *  @param pEdge is an array of parent pointers; on return pEdge[u] is the
 *  number of the edge connecting u to its parent in the shortest path tree
 *  @param d is array of distances; on return d[u] is the shortest path
 *  distance from s to u
 *  @return true on success, false if not all vertices can be reached
 */
bool spt_d(Graph_wd& g, vertex s, edge* pEdge, edgeLength* d) {
	Heap_d<int> nheap(g.n(),4);

	for (vertex v = 1; v <= g.n(); v++) { pEdge[v] = 0; d[v] = INT_MAX; }
	d[s] = 0; nheap.insert(s,0);
	int cnt = 0;
	while (!nheap.empty()) {
		vertex v = nheap.deletemin(); cnt++;
		for (edge e = g.firstOut(v); e != 0; e = g.nextOut(v,e)) {
			vertex w = g.head(e);
			if (d[w] > d[v] + g.length(e)) {
				d[w] = d[v] + g.length(e); pEdge[w] = e;
				if (nheap.member(w)) nheap.changekey(w, d[w]);
				else nheap.insert(w, d[w]);
			}
		}
	}
	return cnt == g.n();
}

} // ends namespace
