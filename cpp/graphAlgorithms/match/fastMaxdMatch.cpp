/** @file fastMaxdMatch.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "fastMaxdMatch.h"

namespace grafalgo {

/** Find a matching in the bipartite graph graf that includes an
 *  edge at every vertex of maximum degree.
 *  This version includes some opimtimizations to speed up execution
 *  for typical graphs.
 *  graf1 is a reference to the graph
 *  match is a reference to a list in which the matching is returned
 */
fastMaxdMatch::fastMaxdMatch(Graph& graf1, Glist<edge>& match) {
	init(graf1);

	// find an initial matching, by examining edges at max degree
	// vertices and adding the first non-conflicting edge we find (if any)
	for (vertex u = 1; u <= graf->n(); u++) {
		if (d[u] != maxd || mEdge[u] != 0) continue;
		for (edge e = graf->firstAt(u); e != 0; e = graf->nextAt(u,e)) {
			vertex v = graf->mate(u,e);
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
	for (vertex u = 1; u <= graf->n(); u++) {
		edge e = mEdge[u];
		if (e != 0 && u < graf->mate(u,e)) match.addLast(e); 
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
void fastMaxdMatch::init(Graph& graf1) {
	// initialize stuff in base class
	maxdMatch::init(graf1);

	// allocate storage for added data structures
	roots = new Dlist(graf->n());
	visited = new int[graf->n()+1];    
	q = new List(graf->maxEdgeNum());

	for (vertex u = 1; u <= graf->n(); u++) {
		pEdge[u] = mEdge[u] = visited[u] = 0;
		if (d[u] == maxd) roots->addLast(u);
	}
}

void fastMaxdMatch::cleanup() {
	delete [] mEdge;  delete [] visited; delete roots;
}

/** Extend the matching, so it covers at least one more max degree vertex.
 *  @param e is the number of an edge; there are two possible cases;
 *  if e is a matching edge, we flip the edges on the path from e
 *  to the root of the tree; otherwise e connects a free vertex to
 *  a vertex in the tree and the tree path plus e forms an augmenting path.
 */
void fastMaxdMatch::extend(edge e) {
	vertex u = graf->left(e);
	if (mEdge[u] == e) {
		if (pEdge[u] != e) u = graf->right(e);
		mEdge[u] = 0;
		while (pEdge[u] != 0) {
			e = pEdge[u]; u = graf->mate(u,e); e = pEdge[u];
			mEdge[u] = e; u = graf->mate(u,e); mEdge[u] = e;
		}
		return;
	}

	u = graf->left(e);
	if (pEdge[u] == 0) u = graf->right(e);
	vertex v = graf->mate(u,e);
	if (roots->member(v)) roots->remove(v);
	mEdge[u] = mEdge[v] = e;
	while (pEdge[u] != 0) {
		e = pEdge[u]; u = graf->mate(u,e); e = pEdge[u];
		mEdge[u] = e; u = graf->mate(u,e); mEdge[u] = e;
	}
}

/** Find a path in graf that can be used to add another max degree
 *  vertex to the matching.
 */
edge fastMaxdMatch::findPath() {
	// find a max degree vertex that's unmatched
	vertex root = roots->first();
	if (root == 0) return 0;
	roots->removeFirst();
	visited[root] = phase;

	q->clear();
	for (edge e = graf->firstAt(root); e != 0; e = graf->nextAt(root,e)) {
		q->addLast(e);
	}
	edge e;
	while (!q->empty()) {
		e = q->first(); q->removeFirst();
		vertex v = (visited[graf->left(e)] == phase ?
				graf->left(e) : graf->right(e));
		vertex w = graf->mate(v,e);
		if (visited[w] == phase) continue;
		if (mEdge[w] == 0) { pEdge[w] = 0; break; }
		vertex x = graf->mate(w,mEdge[w]);
		visited[w] = phase; pEdge[w] = e;
		visited[x] = phase; pEdge[x] = mEdge[x];
		if (d[x] < maxd) { e = pEdge[x]; break; }
		for (edge ee = graf->firstAt(x); ee != 0;
		          ee = graf->nextAt(x,ee)) {
			if ((ee != mEdge[x]) && !q->member(ee))
				q->addLast(ee);
		}
	}
	return e;
}

} // ends namespace
