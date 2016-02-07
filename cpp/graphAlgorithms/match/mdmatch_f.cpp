/** @file mdmatch_f.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "mdmatch_f.h"

namespace grafalgo {

/** Find a matching in a bipartite graph graf that includes an
 *  edge at every vertex of maximum degree.
 *  This version includes some optimizations to speed up execution
 *  for typical graphs.
 *  @param[in] g is a graph
 *  @param[in,out] matchingEdge[u] is (on return) the matching edge incident
 *  to u or 0 if u is unmatched; if matchingEdge is not all 0 initially,
 *  it is assumed to represent a valid initial matching
 */
mdmatch_f::mdmatch_f(const Graph& g, edge *matchingEdge)
		     : mdmatch(g,matchingEdge) {
	init();

	// find an initial matching, by examining edges at max degree
	// vertices and adding the first non-conflicting edge we find (if any)
	for (vertex u = 1; u <= gp->n(); u++) {
		if (d[u] != maxd || mEdge[u] != 0) continue;
		for (edge e = gp->firstAt(u); e != 0; e = gp->nextAt(u,e)) {
			vertex v = gp->mate(u,e);
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

	mdmatch::cleanup(); cleanup();
}

/** Initizalize all data structures used by the algorithm.
 *  Includes allocation and initialization of dynamic data structures.
 *  In addition to the data structures provided by the base class,
 *  we add a list roots containing unmatched vertices of maximum degree,
 *  the queue used by findpath and the array visited[] which keeps track
 *  of the most recent phase in which each vertex has been visited.
 */
void mdmatch_f::init() {
	// initialize stuff in base class
	mdmatch::init();

	// allocate storage for added data structures
	roots = new List_d(gp->n());
	visited = new int[gp->n()+1];    
	q = new List(gp->M());

	for (vertex u = 1; u <= gp->n(); u++) {
		pEdge[u] = visited[u] = 0;
		if (d[u] == maxd && mEdge[u] == 0) roots->addLast(u);
	}
}

void mdmatch_f::cleanup() {
	delete q; delete [] visited; delete roots;
}

/** Extend the matching, so it covers at least one more max degree vertex.
 *  @param e is the number of an edge; there are two possible cases;
 *  if e is a matching edge, we flip the edges on the path from e
 *  to the root of the tree; otherwise e connects a free vertex to
 *  a vertex in the tree and the tree path plus e forms an augmenting path.
 */
void mdmatch_f::extend(edge e) {
	vertex u = gp->left(e);
	if (mEdge[u] == e) {
		if (pEdge[u] != e) u = gp->right(e);
		mEdge[u] = 0;
		while (pEdge[u] != 0) {
			e = pEdge[u]; u = gp->mate(u,e); e = pEdge[u];
			mEdge[u] = e; u = gp->mate(u,e); mEdge[u] = e;
		}
		return;
	}

	u = gp->left(e);
	if (pEdge[u] == 0) u = gp->right(e);
	vertex v = gp->mate(u,e);
	if (roots->member(v)) roots->remove(v);
	mEdge[u] = mEdge[v] = e;
	while (pEdge[u] != 0) {
		e = pEdge[u]; u = gp->mate(u,e); e = pEdge[u];
		mEdge[u] = e; u = gp->mate(u,e); mEdge[u] = e;
	}
}

/** Find a path in g that can be used to add another max degree
 *  vertex to the matching.
 */
edge mdmatch_f::findPath() {
	// find a max degree vertex that's unmatched
	vertex root = roots->first();
	if (root == 0) return 0;
	roots->removeFirst();
	visited[root] = phase;

	q->clear();
	for (edge e = gp->firstAt(root); e != 0; e = gp->nextAt(root,e)) {
		q->addLast(e);
	}
	edge e;
	while (!q->empty()) {
		e = q->first(); q->removeFirst();
		vertex v = (visited[gp->left(e)] == phase ?
				gp->left(e) : gp->right(e));
		vertex w = gp->mate(v,e);
		if (visited[w] == phase) continue;
		if (mEdge[w] == 0) { pEdge[w] = 0; break; }
		vertex x = gp->mate(w,mEdge[w]);
		visited[w] = phase; pEdge[w] = e;
		visited[x] = phase; pEdge[x] = mEdge[x];
		if (d[x] < maxd) { e = pEdge[x]; break; }
		for (edge ee = gp->firstAt(x); ee != 0;
		          ee = gp->nextAt(x,ee)) {
			if ((ee != mEdge[x]) && !q->member(ee))
				q->addLast(ee);
		}
	}
	return e;
}

} // ends namespace
