/** @file dinic.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "dinic.h"

using namespace grafalgo;

/** Find maximum flow using Dinic's algorithm.
 *  @param fg1 is a reference to the flograph for which a max flow is
 *  required; on return, the flow fields of the flow graph contain
 *  the max flow
 *  @param floVal is a reference to an integer in which the value of
 *  the resulting flow is returned
 */
dinic::dinic(Flograph& fg1, int& floVal) : augPath(fg1,floVal) {
        level = new int[fg->n()+1];
        nextEdge = new edge[fg->n()+1];

	floVal = 0;
        while (newPhase()) {
        	while (findPath()) floVal += augment();
        }
	delete [] level; delete [] nextEdge;
}

/** Prepare for a new phase.
 *  @return true if the graph contains an augmenting path, else false
 */
bool dinic::newPhase() {
	vertex u,v; edge e;
	List q(fg->n());

	for (u = 1; u <= fg->n(); u++) {
		level[u] = fg->n(); nextEdge[u] = fg->firstAt(u);
	}
	q.addLast(fg->src()); level[fg->src()] = 0;
	while (!q.empty()) {
		u = q.first(); q.removeFirst();
		for (e = fg->firstAt(u); e != 0; e = fg->nextAt(u,e)) {
			v = fg->mate(u,e);
			if (fg->res(u,e) > 0 && level[v] == fg->n()) {
				level[v] = level[u] + 1; 
				if (v == fg->snk()) return true;
				q.addLast(v);
			}
		}
	}
	return false;
}

/** Find a shortest augmenting path.
 *  @param u is the "current" vertex in the recursive path search
 */
bool dinic::findPath(vertex u) {
        vertex v; edge e;

	for (e = nextEdge[u]; e != 0; e = fg->nextAt(u,e)) {
		v = fg->mate(u,e);
		if (fg->res(u,e) == 0 || level[v] != level[u] + 1) continue;
		if (v == fg->snk() || findPath(v)) {
			pEdge[v] = e; nextEdge[u] = e; return true;
		}
	}
	nextEdge[u] = 0; return false;
}
