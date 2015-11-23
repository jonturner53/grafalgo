/** @file mflo_dDjsets_lct.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "mflo_dDjsets_lct.h"

namespace grafalgo {

/** Find a max flow using Dinic's algorith with dynamic trees.
 *  @param g1 is a flow graph
 */
mflo_dDjsets_lct::mflo_dDjsets_lct(Graph_f& g1) : g(&g1) {
	level  = new int[g->n()+1]; nextEdge = new int[g->n()+1];
	upEdge = new int[g->n()+1]; dt = new Djsets_lct(g->n());

	for (vertex u = 1; u <= g->n(); u++) {
		dt->addcost(u,INT_MAX);
		level[u] = nextEdge[u] = upEdge[u] = 0;
	}

        while (newPhase()) {
                while (findPath()) augment();
        }
	delete [] level; delete[] upEdge; delete [] nextEdge; delete dt;
}

/** Find an augmenting path.
 *  @return true if there is an augmenting path.
 */
bool mflo_dDjsets_lct::findPath() {
        vertex u, v; edge e;

	while (nextEdge[g->src()] != 0) {
		u = dt->findroot(g->src()); e = nextEdge[u];
		while (1) { // look for forward path
			if (u == g->snk()) return true;
			if (e == 0) { nextEdge[u] = 0; break; }
			v = g->mate(u,e);
			if (g->res(u,e) > 0 && level[v] == level[u] + 1
			    && nextEdge[v] != 0) {
				dt->addcost(u,g->res(u,e) - dt->nodeCost(u));
				dt->link(u,v); upEdge[u] = e;
				nextEdge[u] = e;
				u = dt->findroot(g->src()); e = nextEdge[u];
			} else {
				e = g->nextAt(u,e);
			}
		}
		// prune dead-end
		for (e = g->firstAt(u); e != 0; e = g->nextAt(u,e)) {
			v = g->mate(u,e);
			//if (u != dt->parent(v) || e != upEdge[v]) continue;
			if (e != upEdge[v]) continue;
			dt->cut(v); upEdge[v] = 0;
			g->addFlow(v,e,
				(g->cap(v,e)-dt->nodeCost(v)) - g->f(v,e));
			dt->addcost(v,INT_MAX - dt->nodeCost(v));
		}
	}
	return false;
}

/** Add flow to the source-sink path defined by the path in the
 *  dynamic trees data structure
 *  @return the amount of flow added to the path
 */
int mflo_dDjsets_lct::augment() {
	vertex u; edge e;

	NodeCostPair p = dt->findcost(g->src());
	int flo = p.c;
	dt->addcost(g->src(),-flo);
	for (p = dt->findcost(g->src()); p.c==0; p = dt->findcost(g->src())) {
		u = p.x; e = upEdge[u];
		g->addFlow(u,e,g->cap(u,e) - g->f(u,e));
		dt->cut(u); upEdge[u] = 0;
		dt->addcost(u,INT_MAX);
	}
	return flo;
}

/** Prepare for a new phase. 
 *  @return true if there is are still augmenting paths.
 */
bool mflo_dDjsets_lct::newPhase() {
	vertex u, v; edge e;
	List q(g->n());
	for (u = 1; u <= g->n(); u++) {
		nextEdge[u] = g->firstAt(u);
		//if (dt->parent(u) != 0) { // cleanup from previous phase
		if (upEdge[u] != 0) { // cleanup from previous phase
			e = upEdge[u];
			g->addFlow(u,e,
				(g->cap(u,e)-dt->nodeCost(u)) - g->f(u,e));
			dt->cut(u);
			dt->addcost(u,INT_MAX - dt->nodeCost(u));
			upEdge[u] = 0;
		}
		level[u] = g->n();
	}
	q.addLast(g->src()); level[g->src()] = 0;
	while (!q.empty()) {
		u = q.first(); q.removeFirst();
		for (e = g->firstAt(u); e != 0; e = g->nextAt(u,e)) {
			v = g->mate(u,e);
			if (g->res(u,e) > 0 && level[v] == g->n()) {
				level[v] = level[u] + 1; q.addLast(v);
				if (v == g->snk()) return true;
			}
		}
	}
	return false;
}

} // ends namespace
