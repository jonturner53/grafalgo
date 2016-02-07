/** @file mdmatch.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "mdmatch.h"

namespace grafalgo {

/** Find a matching in a bipartite graph that includes an
 *  edge at every vertex of maximum degree.
 *  @param[in] g is a graph
 *  @param[in,out] matchingEdge[u] is (on return) the matching edge incident
 *  to u or 0 if u is unmatched; if matchingEdge is not all 0 initially,
 *  it is assumed to represent a valid initial matching
 
	Note: this can be improved by solving a max-flow problem with
	min flow requirements. The source/sink edges at max degree vertices
	are given a min flow of 1. Using Dinic's algorithm within the max-flow
	subproblems leads to an O(m n^1/2) algorithm. Alternatively, one
	can solve two bipartite matching problems using matchb_hk
	and combining them to gain a matching on all max degree vertices.

 */
mdmatch::mdmatch(const Graph& g, edge *matchingEdge)
		 : gp(&g), mEdge(matchingEdge) {
	init();
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
void mdmatch::init() {
	pEdge = new edge[gp->n()+1];

	// compute vertex degrees and max degree
	d = new int[gp->n()+1];
	for (vertex u = 0; u <= gp->n(); u++) d[u] = mEdge[u] = 0;
	maxd = 0; 
	for (edge e = gp->first(); e != 0; e = gp->next(e)) {
		vertex u = gp->left(e); vertex v = gp->right(e);
		d[u]++; d[v]++;
		maxd = max(maxd,max(d[u],d[v]));
	}
}

void mdmatch::cleanup() { delete [] pEdge; delete [] d; }

/** Extend the matching, so it covers at least one more max degree vertex.
 *  @param e is the number of an edge; there are two possible cases;
 *  if e is a matching edge, we flip the edges on the path from e
 *  to the root of the tree; otherwise e connects a free vertex to
 *  a vertex in the tree and the tree path plus e forms an augmenting path.
 */
void mdmatch::extend(edge e) {
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
	mEdge[u] = mEdge[gp->mate(u,e)] = e;
	while (pEdge[u] != 0) {
		e = pEdge[u]; u = gp->mate(u,e); e = pEdge[u];
		mEdge[u] = e; u = gp->mate(u,e); mEdge[u] = e;
	}
}

/** Find a path in g that can be used to add another max degree
 *  vertex to the matching.
 *  @return an edge e that is at the "far end" of a tree path
 *  to the root of the tree defined by pEdge[];
 *  e may be either a matching edge, or an edge that connects
 *  a tree node to an edge that is not in the tree.
 */
edge mdmatch::findPath() {
	enum stype { unreached, odd, even };
	stype state[gp->n()+1];

	vertex root = 0;
	for (vertex u = 1; u <= gp->n(); u++) {
		pEdge[u] = 0; state[u] = unreached;
		if (d[u] == maxd && mEdge[u] == 0) root = u; 
	}

	if (root == 0) return 0;
	state[root] = even;
	List q(gp->M());

	for (edge e = gp->firstAt(root); e != 0; e = gp->nextAt(root,e)) {
		q.addLast(e);
	}

	while (!q.empty()) {
		edge e = q.first(); q.removeFirst();
		vertex v = (state[gp->left(e)] == even ?
				gp->left(e) : gp->right(e));
		vertex w = gp->mate(v,e);
		if (state[w] != unreached) continue;
		if (mEdge[w] == 0) return e;
		vertex x = gp->mate(w,mEdge[w]);
		state[w] = odd; pEdge[w] = e;
		state[x] = even; pEdge[x] = mEdge[x];
		if (d[x] < maxd) return pEdge[x];
		for (edge ee = gp->firstAt(x); ee != 0;
		          ee = gp->nextAt(x,ee)) {
			if (ee != mEdge[x] && !q.member(ee)) q.addLast(ee);
		}
	}
	return 0;
}

} // ends namespace
