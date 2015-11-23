#include "stdinc.h"
#include "List.h"
#include "Graph_wd.h"

namespace grafalgo {

/** Compute a shortest path tree using Bellman-Moore scanning algorithm.
 *  @param g is a directed graph with edge lengths
 *  @param s is the source vertex for the shortest path tree computation;
 *  if s=0, paths are computed from an imaginary extra vertex with a
 *  zero length edge to every other vertex
 *  @param pEdge is an array of parent pointers; on return pEdge[u] is the
 *  number of the edge connecting u to its parent in the shortest path tree
 *  @param d is array of distances; on return d[u] is the shortest path
 *  distance from s to u
 *  @return true on success, false if a negative cost cycle was encountered
 */
bool spt_bm(Graph_wd& g, vertex s, edge pEdge[], edgeLength d[]) {
	for (vertex v = 1; v <= g.n(); v++) { pEdge[v] = 0; d[v] = INT_MAX; }

	List q(g.n()); vertex last;
	if (s != 0) {
		d[s] = 0; q.addLast(s); last = s;
	} else {
		for (vertex v = 1; v <= g.n(); v++) {
			d[v] = 0; q.addLast(v);
		}
		last = g.n();
	}

	int pass = 0; int cnt = 0;
	while (!q.empty()) {
		vertex v = q.first(); q.removeFirst();
		for (edge e = g.firstOut(v); e != 0; e = g.nextOut(v,e)) {
			vertex w = g.head(e);
			if (d[v] + g.length(e) < d[w]) {
				if (pEdge[w] == 0) cnt++;
				d[w] = d[v] + g.length(e); pEdge[w] = e;
				if (!q.member(w)) q.addLast(w);
			}
		}
		if (v == last && !q.empty()) { pass++; last = q.last(); }
		if (pass == g.n()) return false;
	}
	return cnt == g.n();
}

} // ends namespace
