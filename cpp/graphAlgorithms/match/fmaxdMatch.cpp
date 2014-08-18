#include "fmaxdMatch.h"

using namespace grafalgo;

/** Find a matching in the bipartite graph graf that includes an
 *  edge at every vertex of maximum degree.
 *  graf1 is a reference to the graph
 *  match1 is a reference to a list in which the matching is returned
 */
fmaxdMatch::fmaxdMatch(Graph& graf1, Dlist& match1) {
	init(graf1,match1);

	// find an initial matching, by examining edges at max degree
	// vertices and adding the first non-conflicting edge we find;
	// account for the time spent on this using fpLoop
	for (vertex u = 1; u <= graf->n(); u++) {
		if (d[u] != maxd || mEdge[u] != 0) continue;
		for (edge e = graf->firstAt(u); e != 0; e = graf->nextAt(u,e)) {
			vertex v = graf->mate(u,e);
			if (mEdge[v] == 0) {
				match->addLast(e);
				mEdge[u] = mEdge[v] = e;
				if (maxdVerts->member(u))
					maxdVerts->remove(u);
				if (maxdVerts->member(v))
					maxdVerts->remove(v);
				break;
			}
		}
	}

	edge e;
	phase = 1;
	while((e = findPath()) != 0) {
		extend(e); phase++;
	}

	maxdMatch::cleanup(); cleanup();
}

/** Initizalize all data structures used by the algorithm.
 *  Includes allocation and initialization of dynamic data structures.
 *  In addition to the data structures provided by the base class,
 *  we add an mEdge array, a list maxdVerts containing unmatched
 *  vertices of maximum degree, the queue used by findpath
 *  and the array visited[] which keeps track of the most recent
 *  phase in which each vertex has been visited.
 */
void fmaxdMatch::init(Graph& graf1, Dlist& match1) {
	// initialize stuff in base class
	maxdMatch::init(graf1,match1);

	// allocate storage for added data structures
	mEdge = new edge[graf->n()+1]; 
	maxdVerts = new Dlist(graf->n());
	visited = new int[graf->n()+1];    
	q = new List(maxe);

	for (vertex u = 1; u <= graf->n(); u++) {
		pEdge[u] = mEdge[u] = visited[u] = 0;
		if (d[u] == maxd) maxdVerts->addLast(u);
	}
}

void fmaxdMatch::cleanup() {
	delete [] mEdge;  delete [] visited; delete maxdVerts;
}

/** Extend the matching, so it covers at least one more max degree vertex.
 *  @param e is the number of an edge; there are two possible cases;
 *  if e is a matching edge, we flip the edges on the path from e
 *  to the root of the tree; otherwise e connects a free vertex to
 *  a vertex in the tree and the tree path plus e forms an augmenting path.
 */
void fmaxdMatch::extend(edge e) {
	vertex u, v;

	if (match->member(e)) {
		u = graf->left(e);
		if (pEdge[u] != e) u = graf->right(e);
		mEdge[u] = 0;
		while (pEdge[u] != 0) {
			e = pEdge[u]; match->remove(e);  u = graf->mate(u,e);
			e = pEdge[u]; match->addLast(e);
			mEdge[u] = e; u = graf->mate(u,e); mEdge[u] = e;
		}
		return;
	}
	match->addLast(e);
	u = graf->left(e); v = graf->right(e);
	if (maxdVerts->member(u)) maxdVerts->remove(u);
	if (maxdVerts->member(v)) maxdVerts->remove(v);
	mEdge[u] = mEdge[v] = e;
	if (pEdge[u] == 0) u = v;
	while (pEdge[u] != 0) {
		e = pEdge[u];
		match->remove(e);  u = graf->mate(u,e); 
		e = pEdge[u]; match->addLast(e);
		mEdge[u] = e; u = graf->mate(u,e); mEdge[u] = e;
	}
}

/** Find a path in graf that can be used to add another max degree
 *  vertex to the matching.
 */
edge fmaxdMatch::findPath() {
	// find a max degree vertex that's unmatched
	vertex root = maxdVerts->first();
	if (root == 0) return 0;
	maxdVerts->removeFirst();
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
