/** @file match_eg.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "match_eg.h"

namespace grafalgo {

/** Find a maximum size matching.
 *  @param[in] g is an undirected graph
 *  @param[in,out] matchingEdge[u] is (on return) the matching edge incident
 *  to u, or 0 if u is unmatched; if matchingEdge is not all zero initially, it
 *  is assumed to represent a valid initial matching
 */
match_eg::match_eg(const Graph& g, edge *matchingEdge)
		   : match_egc(g,matchingEdge) {
	// Create initial maximal (not maximum) matching
	for (edge e = gp->first(); e != 0; e = gp->next(e)) {
		vertex u = gp->left(e); vertex v = gp->right(e);
		if (mEdge[u] == 0 && mEdge[v] == 0) {
			mEdge[u] = mEdge[v] = e;
		}
	}
	// Make it maximum
	edge e;
	while ((e = findpath()) != 0) augment(e);
}

/** Search for an augmenting path.
 *  @return an unmatched edge on the augmenting path or 0 if
 *  no augmenting path is found; on success, the list in the augpath data
 *  structure that includes the returned edge defines the augmenting path.
 */
edge match_eg::findpath() {
	blossoms->clear();
	List q(gp->M()); // list of edges to be processed in main loop
	for (vertex u = 1; u <= gp->n(); u++) {
		pEdge[u] = 0; origin[u] = u; state[u] = unreached;
		if (mEdge[u] == 0) {
			state[u] = even;
			for (edge e = gp->firstAt(u); e != 0;
				  e = gp->nextAt(u,e))
				q.addLast(e);
		}
	}

	while (!q.empty()) {
		edge e = q.first(); q.removeFirst();
		vertex u = gp->left(e); vertex up = base(u);
		if (state[up] != even) { u = gp->right(e); up = base(u); }
		vertex v = gp->mate(u,e); vertex vp = base(v);
		if (up == vp) continue; // skip internal edges in a blossom
		if (state[vp] == odd) continue;
		if (state[vp] == unreached) {
			// v is not contained in a blossom and is matched
			// so extend tree and add newly eligible edges to q
			vertex w = gp->mate(v,mEdge[v]);
			state[v] = odd;  pEdge[v] = e;
			state[w] = even; pEdge[w] = mEdge[v];
			for (edge ee = gp->firstAt(w); ee != 0;
			     	  ee = gp->nextAt(w,ee)) {
				if ((ee != mEdge[w]) && !q.member(ee))
					q.addLast(ee);
			}
			continue;
		}
		// up and vp are both even
		vertex a = nca(up,vp);
		if (a == 0) {
			// up, vp are different trees - construct path & return
			edge ee = augpath->join(
					augpath->reverse(path(u,root(up))),e);
			return augpath->join(ee,path(v,root(vp)));
		}
		// up and vp are in same tree - collapse blossom
		vertex x = up;
		while (x != a) {
			origin[blossoms->link(blossoms->find(x),
					      blossoms->find(a))] = a;
			x = gp->mate(x,pEdge[x]); // x now odd
			origin[blossoms->link(x,blossoms->find(a))] = a;
			bridge[x].e = e; bridge[x].v = u;
			for (edge ee = gp->firstAt(x); ee != 0;
			     	  ee = gp->nextAt(x,ee)) {
				if (!q.member(ee)) q.addLast(ee);
			}
			x = base(gp->mate(x,pEdge[x]));
		}
		x = vp;
		while (x != a) {
			origin[blossoms->link(blossoms->find(x),
					      blossoms->find(a))] = a;
			x = gp->mate(x,pEdge[x]); // x now odd
			origin[blossoms->link(x,blossoms->find(a))] = a;
			bridge[x].e = e; bridge[x].v = v;
			for (edge ee = gp->firstAt(x); ee != 0;
			     	  ee = gp->nextAt(x,ee)) {
				if (!q.member(ee)) q.addLast(ee);
			}
			x = base(gp->mate(x,pEdge[x]));
		}
	}
	return 0;
}

} // ends namespace
