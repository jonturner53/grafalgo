/** @file maxdMatch.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "maxdMatch.h"

using namespace grafalgo;

/** Find a matching in the bipartite graph graf that includes an
 *  edge at every vertex of maximum degree.
 *  @param graf1 is a reference to the graph
 *  @param match1 is a reference to a list of edges in which the result is
 *  returned
 */
maxdMatch::maxdMatch(Graph& graf1, Dlist& match1) {
	init(graf1, match1);

	while(true) {
		edge e = findPath();
		if (e == 0) break;
		extend(e);
	}

	cleanup();
}

/** Initizalize all data structures used by the algorithm.
 *  Includes allocation and initialization of dynamic data structures
 *  and initialization of the vertex degree values d[u].
 */
void maxdMatch::init(Graph& graf1, Dlist& match1) {
	graf = &graf1; match = &match1;
	pEdge = new edge[graf->n()+1];

	// compute vertex degrees and max degree
	// find largest edge number
	d = new int[graf->n()+1];
	for (vertex u = 0; u <= graf->n(); u++) d[u] = 0;
	maxd = 0; maxe = 0;
	for (edge e = graf->first(); e != 0; e = graf->next(e)) {
		vertex u = graf->left(e); vertex v = graf->right(e);
		d[u]++; d[v]++;
		maxd = max(maxd,d[u]); maxd = max(maxd,d[v]);
		maxe = max(e,maxe);
	}
}

void maxdMatch::cleanup() { delete [] pEdge; delete [] d; }

/** Extend the matching, so it covers at least one more max degree vertex.
 *  @param e is the number of an edge; there are two possible cases;
 *  if e is a matching edge, we flip the edges on the path from e
 *  to the root of the tree; otherwise e connects a free vertex to
 *  a vertex in the tree and the tree path plus e forms an augmenting path.
 */
void maxdMatch::extend(edge e) {
	vertex u;
	if (match->member(e)) {
		u = graf->left(e);
		if (pEdge[u] != e) u = graf->right(e);
		while (pEdge[u] != 0) {
			e = pEdge[u]; match->remove(e);  u = graf->mate(u,e);
			e = pEdge[u]; match->addLast(e); u = graf->mate(u,e); 
		}
		return;
	}
	match->addLast(e);
	u = graf->left(e);
	if (pEdge[u] == 0) u = graf->right(e);
	while (pEdge[u] != 0) {
		e = pEdge[u]; match->remove(e);  u = graf->mate(u,e); 
		e = pEdge[u]; match->addLast(e); u = graf->mate(u,e); 
	}
}

/** Find a path in graf that can be used to add another max degree
 *  vertex to the matching.
 *  @return an edge e that is at the "far end" of a tree path
 *  to the root of the tree defined by pEdge[];
 *  e may be either a matching edge, or an edge that connects
 *  a tree node to an edge that is not in the tree.
 */
edge maxdMatch::findPath() {
	enum stype { unreached, odd, even };
	stype state[graf->n()+1];
	edge mEdge[graf->n()+1];  // mEdge[u] = matching edge incident to u

	for (vertex u = 1; u <= graf->n(); u++) {
		state[u] = unreached; mEdge[u] = pEdge[u] = 0;
	}
	for (edge e = match->first(); e != 0; e = match->next(e)) {
		vertex u = graf->left(e); vertex v = graf->right(e);
		state[u] = state[v] = unreached;
		mEdge[u] = mEdge[v] = e;
	}

	// find a max degree vertex that's unmatched
	vertex root = 0;
	for (vertex u = 1; u <= graf->n(); u++) {
		if (d[u] == maxd && mEdge[u] == 0) {
			root = u; break;
		}
	}
	if (root == 0) return 0;
	state[root] = even;

	List q(maxe);
	for (edge e = graf->firstAt(root); e != 0; e = graf->nextAt(root,e)) {
		q.addLast(e);
	}

	edge e;
	while (!q.empty()) {
		e = q.first(); q.removeFirst();
		vertex v = (state[graf->left(e)] == even ?
				graf->left(e) : graf->right(e));
		vertex w = graf->mate(v,e);
		if (state[w] != unreached) continue;
		if (mEdge[w] == 0) break;
		vertex x = graf->mate(w,mEdge[w]);
		state[w] = odd; pEdge[w] = e;
		state[x] = even; pEdge[x] = mEdge[x];
		if (d[x] < maxd) { e = pEdge[x]; break; }
		for (edge ee = graf->firstAt(x); ee != 0;
		          ee = graf->nextAt(x,ee)) {
			if ((ee != mEdge[x]) && !q.member(ee)) {
				q.addLast(ee);
			}
		}
	}
	return e;
}
