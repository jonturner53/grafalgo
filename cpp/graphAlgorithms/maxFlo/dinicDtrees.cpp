/** @file dinicDtrees.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "dinicDtrees.h"

/** Find maximum flow using Dinic's algorithm with dynamic trees.
 *  @param fg1 is a reference to the flograph for which a max flow is
 *  required; on return, the flow fields of the flow graph contain
 *  the max flow
 *  @param floVal is a reference to an integer in which the value of
 *  the resulting flow is returned
 */
dinicDtrees::dinicDtrees(Flograph& fg1, int& floVal) : fg(&fg1) {
	level  = new int[fg->n()+1]; nextEdge = new int[fg->n()+1];
	upEdge = new int[fg->n()+1]; dt = new Dtrees(fg->n());

	for (vertex u = 1; u <= fg->n(); u++) {
		dt->addcost(u,Util::BIGINT32);
		level[u] = nextEdge[u] = upEdge[u] = 0;
	}

	floVal = 0;
        while (newPhase()) {
                while (findPath()) floVal += augment();
        }
	delete [] level; delete[] upEdge; delete [] nextEdge; delete dt;
}

/** Find an augmenting path.
 *  Uses the dynamic trees data structure to find an augmenting path.
 *  On return, the dynamic trees data structure includes a tree path
 *  from the source to the sink.
 */
bool dinicDtrees::findPath() {
        vertex u, v; edge e;

	while (nextEdge[fg->src()] != 0) {
		u = dt->findroot(fg->src()); e = nextEdge[u];
		while (1) { // look for forward path
			if (u == fg->snk()) return true;
			if (e == 0) { nextEdge[u] = 0; break; }
			v = fg->mate(u,e);
			if (fg->res(u,e) > 0 && level[v] == level[u] + 1
			    && nextEdge[v] != 0) {
				dt->addcost(u,fg->res(u,e) - dt->nodeCost(u));
				dt->link(u,v); upEdge[u] = e;
				nextEdge[u] = e;
				u = dt->findroot(fg->src()); e = nextEdge[u];
			} else {
				e = fg->nextAt(u,e);
			}
		}
		// prune dead-end
		for (e = fg->firstAt(u); e != 0; e = fg->nextAt(u,e)) {
			v = fg->mate(u,e);
			if (u != dt->parent(v) || e != upEdge[v]) continue;
			dt->cut(v); upEdge[v] = 0;
			fg->addFlow(v,e,
				(fg->cap(v,e)-dt->nodeCost(v)) - fg->f(v,e));
			dt->addcost(v,Util::BIGINT32 - dt->nodeCost(v));
		}
	}
	return false;
}

/** Add flow to source-sink path defined by the dynamic trees data structure.
 *  After adding flow, the dynamic trees data structure is modified
 *  to remove edges that no longer have positive residual capacity.
 */
int dinicDtrees::augment() {
	vertex u; edge e;

	NodeCostPair p = dt->findcost(fg->src());
	int flo = p.c;
	dt->addcost(fg->src(),-flo);
	for (p = dt->findcost(fg->src()); p.c==0; p = dt->findcost(fg->src())) {
		u = p.x; e = upEdge[u];
		fg->addFlow(u,e,fg->cap(u,e) - fg->f(u,e));
		dt->cut(u);
		dt->addcost(u,Util::BIGINT32);
		upEdge[u] = 0;
	}
	return flo;
}

/** Prepare for a new phase. 
 *  @return true if there is an augmenting path, else false.
 */
bool dinicDtrees::newPhase() {
	vertex u, v; edge e;
	List q(fg->n());
	for (u = 1; u <= fg->n(); u++) {
		nextEdge[u] = fg->firstAt(u);
		if (dt->parent(u) != 0) { // cleanup from previous phase
			e = upEdge[u];
			fg->addFlow(u,e,
				(fg->cap(u,e)-dt->nodeCost(u)) - fg->f(u,e));
			dt->cut(u);
			dt->addcost(u,Util::BIGINT32 - dt->nodeCost(u));
			upEdge[u] = 0;
		}
		level[u] = fg->n();
	}
	q.addLast(fg->src()); level[fg->src()] = 0;
	while (!q.empty()) {
		u = q.first(); q.removeFirst();
		for (e = fg->firstAt(u); e != 0; e = fg->nextAt(u,e)) {
			v = fg->mate(u,e);
			if (fg->res(u,e) > 0 && level[v] == fg->n()) {
				level[v] = level[u] + 1; q.addLast(v);
				if (v == fg->snk()) return true;
			}
		}
	}
	return false;
}
