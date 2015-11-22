/** @file fastMaxdMatch.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "fastMaxdMatch.h"

namespace grafalgo {

/** Find a matching in a bipartite graph graf that includes an
 *  edge at every vertex of maximum degree.
 *  This version includes some opimtimizations to speed up execution
 *  for typical graphs.
 *  @param g1 is a reference to the graph
 *  @param match is a reference to a list in which the matching is returned
 */
fastMaxdMatch::fastMaxdMatch(Graph& g1, Glist<edge>& match) {
	init(g1);

	// find an initial matching, by examining edges at max degree
	// vertices and adding the first non-conflicting edge we find (if any)
	for (vertex u = 1; u <= g->n(); u++) {
		if (d[u] != maxd || mEdge[u] != 0) continue;
		for (edge e = g->firstAt(u); e != 0; e = g->nextAt(u,e)) {
			vertex v = g->mate(u,e);
			if (mEdge[v] == 0) {
				mEdge[u] = mEdge[v] = e;
				if (roots->member(u)) roots->remove(u);
				if (roots->member(v)) roots->remove(v);
				break;
			}
		}
	}

	edge e;
	phase = 1;
	while((e = findPath()) != 0) { extend(e); phase++; }

	match.clear(); 
	for (vertex u = 1; u <= g->n(); u++) {
		edge e = mEdge[u];
		if (e != 0 && u < g->mate(u,e)) match.addLast(e); 
	}

	maxdMatch::cleanup(); cleanup();
}

/** Initizalize all data structures used by the algorithm.
 *  Includes allocation and initialization of dynamic data structures.
 *  In addition to the data structures provided by the base class,
 *  we add a list roots containing unmatched vertices of maximum degree,
 *  the queue used by findpath and the array visited[] which keeps track
 *  of the most recent phase in which each vertex has been visited.
 */
void fastMaxdMatch::init(Graph& g1) {
	// initialize stuff in base class
	maxdMatch::init(g1);

	// allocate storage for added data structures
	roots = new Dlist(g->n());
	visited = new int[g->n()+1];    
	q = new List(g->M());

	for (vertex u = 1; u <= g->n(); u++) {
		pEdge[u] = mEdge[u] = visited[u] = 0;
		if (d[u] == maxd) roots->addLast(u);
	}
}

void fastMaxdMatch::cleanup() {
	delete q; delete [] visited; delete roots;
}

/** Extend the matching, so it covers at least one more max degree vertex.
 *  @param e is the number of an edge; there are two possible cases;
 *  if e is a matching edge, we flip the edges on the path from e
 *  to the root of the tree; otherwise e connects a free vertex to
 *  a vertex in the tree and the tree path plus e forms an augmenting path.
 */
void fastMaxdMatch::extend(edge e) {
	vertex u = g->left(e);
	if (mEdge[u] == e) {
		if (pEdge[u] != e) u = g->right(e);
		mEdge[u] = 0;
		while (pEdge[u] != 0) {
			e = pEdge[u]; u = g->mate(u,e); e = pEdge[u];
			mEdge[u] = e; u = g->mate(u,e); mEdge[u] = e;
		}
		return;
	}

	u = g->left(e);
	if (pEdge[u] == 0) u = g->right(e);
	vertex v = g->mate(u,e);
	if (roots->member(v)) roots->remove(v);
	mEdge[u] = mEdge[v] = e;
	while (pEdge[u] != 0) {
		e = pEdge[u]; u = g->mate(u,e); e = pEdge[u];
		mEdge[u] = e; u = g->mate(u,e); mEdge[u] = e;
	}
}

/** Find a path in g that can be used to add another max degree
 *  vertex to the matching.
 */
edge fastMaxdMatch::findPath() {
	// find a max degree vertex that's unmatched
	vertex root = roots->first();
	if (root == 0) return 0;
	roots->removeFirst();
	visited[root] = phase;

	q->clear();
	for (edge e = g->firstAt(root); e != 0; e = g->nextAt(root,e)) {
		q->addLast(e);
	}
	edge e;
	while (!q->empty()) {
		e = q->first(); q->removeFirst();
		vertex v = (visited[g->left(e)] == phase ?
				g->left(e) : g->right(e));
		vertex w = g->mate(v,e);
		if (visited[w] == phase) continue;
		if (mEdge[w] == 0) { pEdge[w] = 0; break; }
		vertex x = g->mate(w,mEdge[w]);
		visited[w] = phase; pEdge[w] = e;
		visited[x] = phase; pEdge[x] = mEdge[x];
		if (d[x] < maxd) { e = pEdge[x]; break; }
		for (edge ee = g->firstAt(x); ee != 0;
		          ee = g->nextAt(x,ee)) {
			if ((ee != mEdge[x]) && !q->member(ee))
				q->addLast(ee);
		}
	}
	return e;
}

} // ends namespace
