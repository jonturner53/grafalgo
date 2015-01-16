/** @file hopcroftKarp.cpp
 * 
 *  @author Jon Turner
 *  @date 2014
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "hopcroftKarp.h"

namespace grafalgo {

extern bool findSplit(const Graph&, ListPair&);

/** Find a maximum size matching in a bipartite graph using the
 *  Hopcroft-Karp algorithm.
 *  @param g1 is an undirected graph
 *  @param match is a list in which the result is returned
 */
hopcroftKarp::hopcroftKarp(Graph& g1, Glist<edge>& match) : g(&g1) {

	// divide vertices into two independent sets
	split = new ListPair(g->n());
	if (!findSplit(*g,*split))
		Util::fatal("hopcroftKarp: graph is not bipartite");

	// construct initial matching
	mEdge = new edge[g->n()+1];
	for (vertex u = 1; u <= g->n(); u++) mEdge[u] = 0;
	for (edge e = g->first(); e != 0; e = g->next(e)) {
		vertex u = g->left(e); vertex v = g->right(e);
		if (mEdge[u] == 0 && mEdge[v] == 0)
			mEdge[u] = mEdge[v] = e;
	}

	// add unmatched vertices from in-set to roots
	pEdge = new edge[g->n()+1];
	roots = new Dlist(g->n());
	for (vertex u = split->firstIn(); u != 0; u = split->nextIn(u))
		if (mEdge[u] == 0) { roots->addLast(u); pEdge[u] = 0; }

	level = new int[g->n()+1];
	nextEdge = new edge[g->n()+1];
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
	match.clear(); 
	for (vertex u = 1; u <= g->n(); u++) {
		edge e = mEdge[u];
		if (e != 0 && u < g->mate(u,e)) match.addLast(e); 
	}
	delete split; delete roots;
	delete [] mEdge; delete [] pEdge;
	delete [] level; delete [] nextEdge;
}

/** Prepare for new phase. 
 *  @return true if there is an augmenting path.
 */
bool hopcroftKarp::newPhase() {
	for (vertex u = 1; u <= g->n(); u++) {
		level[u] = g->n(); nextEdge[u] = g->firstAt(u);
	}
	List q(g->n());
	for (vertex u = roots->first(); u != 0; u = roots->next(u)) {
		level[u] = 0; q.addLast(u);
	}
	int maxLevel = g->n(); // used to terminate early
	while (!q.empty()) {
		vertex u = q.first(); q.removeFirst(); // u in in-set
		for (edge e = g->firstAt(u); e != 0; e = g->nextAt(u,e)) {
			if (e == mEdge[u]) continue;
			vertex v = g->mate(u,e); // v in out-set
			if (level[v] != g->n()) continue;
			// first time we've seen v
			level[v] = level[u] + 1; 
			edge ee = mEdge[v];
			if (ee == 0) maxLevel = level[v]; // found alt-path
			if (maxLevel == level[v]) continue;
			vertex w = g->mate(v,ee);
			level[w] = level[v] + 1;
			q.addLast(w);
		}
	}
	return (maxLevel != g->n());
}

/** Find an augmenting path from specified vertex.
 *  @param u is a vertex in the in-set
 *  @return an unmatched vertex in the out-set, or 0 if there is no
 *  "legal" path to such a vertex in the current phase;
 *  on successful return, the pEdge array defines
 *  the augmenting path from the returned vertex back to u
 */
vertex hopcroftKarp::findPath(vertex u) {
	for (edge e = nextEdge[u]; e != 0; e = g->nextAt(u,e)) {
		vertex v = g->mate(u,e);
		if (level[v] != level[u] + 1) continue;
		edge ee = mEdge[v];
		if (ee == 0) { nextEdge[u] = e; pEdge[v] = e; return v; }
		vertex w = g->mate(v,ee);
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
void hopcroftKarp::augment(vertex u) {
	while (true) {
		vertex v = g->mate(u,pEdge[u]);
		mEdge[u] = mEdge[v] = pEdge[u];
		if (pEdge[v] == 0) break;
		u = g->mate(v,pEdge[v]);
	}
}

} // ends namespace
