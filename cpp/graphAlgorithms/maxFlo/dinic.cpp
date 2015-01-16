/** @file dinic.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "dinic.h"

namespace grafalgo {

/** Compute a max flow using Dinic's algorithm.
 *  @param g1 is a flow graph; possibly with an initial non-zero flow
 *  @param floVal is a reference to an integer in which the maximum
 *  flow is returned.
 */
dinic::dinic(Flograph& g1) : fordFulkerson(g1) {
        level = new int[g->n()+1];
        nextEdge = new edge[g->n()+1];

        while (newPhase()) { main(); }

	delete [] level; delete [] nextEdge;
}

/** Prepare for new phase. 
 *  @return true if there is a source/sink path.
 */
bool dinic::newPhase() {
	vertex u,v; edge e;
	List q(g->n());

	for (u = 1; u <= g->n(); u++) {
		level[u] = g->n(); nextEdge[u] = g->firstAt(u);
	}
	q.addLast(g->src()); level[g->src()] = 0;
	while (!q.empty()) {
		u = q.first(); q.removeFirst();
		for (e = g->firstAt(u); e != 0; e = g->nextAt(u,e)) {
			v = g->mate(u,e);
			if (g->res(u,e) > 0 && level[v] == g->n()) {
				level[v] = level[u] + 1; 
				if (v == g->snk()) return true;
				q.addLast(v);
			}
		}
	}
	return false;
}

/** Find an augmenting path from specified vertex to sink.
 *  @param u is a vertex
 *  @return true if there is an augmenting path from u to the sink
 */
bool dinic::findPath(vertex u) {
        vertex v; edge e;

	for (e = nextEdge[u]; e != 0; e = g->nextAt(u,e)) {
		v = g->mate(u,e);
		if (g->res(u,e) == 0 || level[v] != level[u] + 1) continue;
		if (v == g->snk() || findPath(v)) {
			pEdge[v] = e; nextEdge[u] = e; return true;
		}
	}
	nextEdge[u] = 0; return false;
}

} // ends namespace
