/** @file maxdMatch.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "maxdMatch.h"

namespace grafalgo {

/** Find a matching in the bipartite graph graf that includes an
 *  edge at every vertex of maximum degree.
 *  @param graf1 is a reference to the graph
 *  @param match1 is a reference to a list of edges in which the result is
 *  returned
 
	Note: this can be improved by solving a max-flow problem with
	min flow requirements. The source/sink edges at max degree vertices
	are given a min flow of 1. Using Dinic's algorithm within the max-flow
	subproblems leads to an O(m n^1/2) algorithm. Alternatively, one
	can solve two bipartite matching problems using hopcroftKarp
	and combining them to gain a matching on all max degree vertices.

 */
maxdMatch::maxdMatch(Graph& graf1, Glist<edge>& match) {
	init(graf1);

	while(true) {
		edge e = findPath();
		if (e == 0) break;
		extend(e);
	}

	match.clear(); 
	for (vertex u = 1; u <= graf->n(); u++) {
		edge e = mEdge[u];
		if (e != 0 && u < graf->mate(u,e)) match.addLast(e); 
	}

	cleanup();
}

/** Initizalize all data structures used by the algorithm.
 *  Includes allocation and initialization of dynamic data structures
 *  and initialization of the vertex degree values d[u].
 */
void maxdMatch::init(Graph& graf1) {
	graf = &graf1;
	mEdge = new edge[graf->n()+1];
	pEdge = new edge[graf->n()+1];

	// compute vertex degrees and max degree
	// find largest edge number
	d = new int[graf->n()+1];
	for (vertex u = 0; u <= graf->n(); u++) d[u] = mEdge[u] = 0;
	maxd = 0; 
	for (edge e = graf->first(); e != 0; e = graf->next(e)) {
		vertex u = graf->left(e); vertex v = graf->right(e);
		d[u]++; d[v]++;
		maxd = max(maxd,max(d[u],d[v]));
	}
}

void maxdMatch::cleanup() { delete [] pEdge; delete [] mEdge; delete [] d; }

/** Extend the matching, so it covers at least one more max degree vertex.
 *  @param e is the number of an edge; there are two possible cases;
 *  if e is a matching edge, we flip the edges on the path from e
 *  to the root of the tree; otherwise e connects a free vertex to
 *  a vertex in the tree and the tree path plus e forms an augmenting path.
 */
void maxdMatch::extend(edge e) {
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
	mEdge[u] = mEdge[graf->mate(u,e)] = e;
	while (pEdge[u] != 0) {
		e = pEdge[u]; u = graf->mate(u,e); e = pEdge[u];
		mEdge[u] = e; u = graf->mate(u,e); mEdge[u] = e;
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

	vertex root = 0;
	for (vertex u = 1; u <= graf->n(); u++) {
		pEdge[u] = 0; state[u] = unreached;
		if (d[u] == maxd && mEdge[u] == 0) root = u; 
	}

	if (root == 0) return 0;
	state[root] = even;
	List q(graf->maxEdgeNum());

	for (edge e = graf->firstAt(root); e != 0; e = graf->nextAt(root,e)) {
		q.addLast(e);
	}

	while (!q.empty()) {
		edge e = q.first(); q.removeFirst();
		vertex v = (state[graf->left(e)] == even ?
				graf->left(e) : graf->right(e));
		vertex w = graf->mate(v,e);
		if (state[w] != unreached) continue;
		if (mEdge[w] == 0) return e;
		vertex x = graf->mate(w,mEdge[w]);
		state[w] = odd; pEdge[w] = e;
		state[x] = even; pEdge[x] = mEdge[x];
		if (d[x] < maxd) return pEdge[x];
		for (edge ee = graf->firstAt(x); ee != 0;
		          ee = graf->nextAt(x,ee)) {
			if (ee != mEdge[x] && !q.member(ee)) q.addLast(ee);
		}
	}
	return 0;
}

} // ends namespace
