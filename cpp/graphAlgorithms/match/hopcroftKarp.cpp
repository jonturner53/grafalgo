/** @file hopcroftKarp.cpp
 * 
 *  @author Jon Turner
 *  @date 2014
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "hopcroftKarp.h"

using namespace grafalgo;

extern bool findSplit(const Graph&, ListPair&);

/** Find a maximum size matching in a bipartite graph using the
 *  Hopcroft-Karp algorithm.
 *  @param graf1 is an undirected graph
 *  @param match is a list in which the result is returned
 *  @param size is an output parameter used to return the size of the
 *  computed matching
 */
hopcroftKarp::hopcroftKarp(Graph& graf1, Glist<edge>& match, int& size) 
		: graf(&graf1) {
	// divide vertices into two independent sets
	split = new ListPair(graf->n());
	if (!findSplit(*graf,*split))
		Util::fatal("hopcroftKarp: graph is not bipartite");

	// construct initial matching
	mEdge = new edge[graf->n()+1];
	for (vertex u = 1; u <= graf->n(); u++) mEdge[u] = 0;
	for (edge e = graf->first(); e != 0; e = graf->next(e)) {
		vertex u = graf->left(e); vertex v = graf->right(e);
		if (mEdge[u] == 0 && mEdge[v] == 0)
			mEdge[u] = mEdge[v] = e;
	}

	// add unmatched vertices from in-set to roots
	roots = new Dlist(graf->n());
	for (vertex u = split->firstIn(); u != 0; u = split->nextIn(u))
		if (mEdge[u] == 0) roots->addLast(u);

	size = 0;
	pEdge = new edge[graf->n()+1];
	nextEdge = new edge[graf->n()+1];
	while (newPhase()) {
		vertex r = roots->first();
		vertex u = findPath(r);
		while (true) {
			if (u == 0) {
				r = roots->next(r);
			} else {
				augment(u); size++;
				vertex nextr = roots->next(r);
				roots->remove(r);
				r = nextr;
			}
			u = findPath(r);
		}
	}
	match.clear(); size = 0;
	for (vertex u = 1; u <= graf->n(); u++) {
		edge e = mEdge[u];
		if (e != 0 && u < graf->mate(u,e)) {
			match.addLast(e); size++;
		}
	}
	delete split; delete roots;
	delete [] mEdge; delete [] pEdge;
	delete [] level; delete [] nextEdge;
}

/** Prepare for new phase. 
 *  @return true if there is an augmenting path.
 */
bool hopcroftKarp::newPhase() {
	for (vertex u = 1; u <= graf->n(); u++) {
		level[u] = graf->n(); nextEdge[u] = graf->firstAt(u);
	}
	List q(graf->n());
	for (vertex u = roots->first(); u != 0; u = roots->next(u)) {
		level[u] = 0; q.addLast(u);
	}
	int maxLevel = graf->n(); // used to terminate early
	while (!q.empty()) {
		vertex u = q.first(); q.removeFirst(); // u in in-set
		if (level[u] > maxLevel) return true;
		for (edge e = graf->firstAt(u); e != 0; e = graf->nextAt(u,e)) {
			if (e == mEdge[u]) continue;
			vertex v = graf->mate(u,e); // v in out-set
			if (level[v] != graf->n()) continue;
			// first time we've seen v
			level[v] = level[u] + 1; 
			edge ee = mEdge[v];
			if (ee == 0) { maxLevel = level[v]; continue; }
			vertex w = graf->mate(v,ee);
			level[w] = level[v] + 1;
			q.addLast(w);
		}
	}
	return (maxLevel != graf->n());
}

/** Find an augmenting path from specified vertex.
 *  @param u is a vertex in the in-set
 *  @return an unmatched vertex in the out-set, or 0 if there is no
 *  "legal" path to such a vertex in the current phase;
 *  on successful return, the pEdge array defines
 *  the augmenting path from the returned vertex back to u
 */
vertex hopcroftKarp::findPath(vertex u) {
	for (edge e = nextEdge[u]; e != 0; e = graf->nextAt(u,e)) {
		vertex v = graf->mate(u,e);
		if (level[v] != level[u] + 1) continue;
		edge ee = mEdge[v];
		if (ee == 0) { pEdge[v] = e; nextEdge[u] = e; return v; }
		vertex w = graf->mate(v,ee);
		vertex t = findPath(w);
		if (t != 0) {
			pEdge[v] = e; pEdge[w] = ee; nextEdge[u] = e;
			return t;
		}
	}
	nextEdge[u] = 0; return 0;
}

/** Flip the edges along an augmenting path
 *  @param u is an endpoint of an augmenting path; the edges in
 *  the path can be found using the pEdge pointers
 */
void hopcroftKarp::augment(vertex u) {
	while (u != 0) {
		vertex v = graf->mate(u,pEdge[u]);
		mEdge[u] = mEdge[v] = pEdge[u];
		u = pEdge[v];
	}
}
