/** @file matchb_hk.cpp
 * 
 *  @author Jon Turner
 *  @date 2014
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "matchb_hk.h"

namespace grafalgo {

extern bool findSplit(const Graph&, ListPair&);

/** Find a maximum size matching in a bipartite graph using the
 *  Hopcroft-Karp algorithm.
 *  @param[in] g is a graph
 *  @param[in,out] matchingEdge[u] is (on return) the matching edge incident
 *  to u or 0 if u is unmatched; if matchingEdge is not all 0 initially,
 *  it is assumed to represent a valid initial matching;
 *  the returned matching matches all the vertices that were
 *  matched in the original matching
 */
matchb_hk::matchb_hk(const Graph& g, edge *matchingEdge)
		     : gp(&g), mEdge(matchingEdge) {

	// divide vertices into two independent sets
	split = new ListPair(gp->n());
	if (!findSplit(*gp,*split))
		Util::fatal("matchb_hk: graph is not bipartite");

	// add edges to mEdge, yielding maximal (not maximum) matching
	for (edge e = gp->first(); e != 0; e = gp->next(e)) {
		vertex u = gp->left(e); vertex v = gp->right(e);
		if (mEdge[u] == 0 && mEdge[v] == 0)
			mEdge[u] = mEdge[v] = e;
	}

	// add unmatched vertices from in-set to roots
	pEdge = new edge[gp->n()+1];
	roots = new List_d(gp->n());
	for (vertex u = split->firstIn(); u != 0; u = split->nextIn(u))
		if (mEdge[u] == 0) { roots->addLast(u); pEdge[u] = 0; }

	level = new int[gp->n()+1];
	nextEdge = new edge[gp->n()+1];
	while (newPhase()) {
		vertex r = roots->first();
		vertex u = findPath(r);
		while (true) {
			if (u == 0) {
				r = roots->next(r);
			} else {
				augment(u); 
				vertex nextr = roots->next(r);
				roots->remove(r);
				r = nextr;
			}
			if (r == 0) break;
			u = findPath(r);
		}
	}
	delete split; delete roots; delete [] pEdge;
	delete [] level; delete [] nextEdge;
}

/** Prepare for new phase. 
 *  @return true if there is an augmenting path.
 */
bool matchb_hk::newPhase() {
	for (vertex u = 1; u <= gp->n(); u++) {
		level[u] = gp->n(); nextEdge[u] = gp->firstAt(u);
	}
	List q(gp->n());
	for (vertex u = roots->first(); u != 0; u = roots->next(u)) {
		level[u] = 0; q.addLast(u);
	}
	int maxLevel = gp->n(); // used to terminate early
	while (!q.empty()) {
		vertex u = q.first(); q.removeFirst(); // u in in-set
		for (edge e = gp->firstAt(u); e != 0; e = gp->nextAt(u,e)) {
			if (e == mEdge[u]) continue;
			vertex v = gp->mate(u,e); // v in out-set
			if (level[v] != gp->n()) continue;
			// first time we've seen v
			level[v] = level[u] + 1; 
			edge ee = mEdge[v];
			if (ee == 0) maxLevel = level[v]; // found alt-path
			if (maxLevel == level[v]) continue;
			vertex w = gp->mate(v,ee);
			level[w] = level[v] + 1;
			q.addLast(w);
		}
	}
	return (maxLevel != gp->n());
}

/** Find an augmenting path from specified vertex.
 *  @param u is a vertex in the in-set
 *  @return an unmatched vertex in the out-set, or 0 if there is no
 *  "legal" path to such a vertex in the current phase;
 *  on successful return, the pEdge array defines
 *  the augmenting path from the returned vertex back to u
 */
vertex matchb_hk::findPath(vertex u) {
	for (edge e = nextEdge[u]; e != 0; e = gp->nextAt(u,e)) {
		vertex v = gp->mate(u,e);
		if (level[v] != level[u] + 1) continue;
		edge ee = mEdge[v];
		if (ee == 0) { nextEdge[u] = e; pEdge[v] = e; return v; }
		vertex w = gp->mate(v,ee);
		if (level[w] != level[v] + 1) continue;
		vertex t = findPath(w);
		if (t != 0) {
			pEdge[v] = e; pEdge[w] = ee; nextEdge[u] = e; return t;
		}
	}
	nextEdge[u] = 0; return 0;
}

/** Flip the edges along an augmenting path
 *  @param u is an endpoint of an augmenting path; the edges in
 *  the path can be found using the pEdge pointers
 */
void matchb_hk::augment(vertex u) {
	while (true) {
		vertex v = gp->mate(u,pEdge[u]);
		mEdge[u] = mEdge[v] = pEdge[u];
		if (pEdge[v] == 0) break;
		u = gp->mate(v,pEdge[v]);
	}
}

} // ends namespace
