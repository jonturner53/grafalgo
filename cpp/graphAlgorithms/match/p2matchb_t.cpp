/** @file p2matchb_t.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "p2matchb_t.h"
#include "matchb_hk.h"

namespace grafalgo {

/** Find a matching in a bipartite graph that matches as many vertices
 *  as possible.
 *  @param g1 is a reference to the graph
 *  @param vset is a list of vertices in g1
 *  @param match is a reference to a list of edges in which the result is
 *  returned; if match is initially non-empty, it is assumed to contain an
 *  initial matching to be used by the algorithm; vertices that are matched
 *  by this initial matching are also matched in the returned matching
 */
p2matchb_t::p2matchb_t(Graph& g1, List_d& vset1, List_g<edge>& match) {
	g = &g1; vset = &vset1;
	mEdge = new edge[g->n()+1]; pEdge = new edge[g->n()+1];
	// initialize mEdge to reflect edges in match
	for (vertex u = 1; u <= g->n(); u++) mEdge[u] = 0;
	for (index x = match.first(); x != 0; x = match.next(x)) {
		edge e = match.value(x);
		mEdge[g->left(e)] = mEdge[g->right(e)] = e;
	}
	// add non-conflicting edges to matching, starting with those
	// incident to free vertices in vset
	for (vertex u = 1; u <= g->n(); u++) {
		if (!vset->member(u) || mEdge[u] != 0) continue;
		for (edge e = g->firstAt(u); e != 0; e = g->nextAt(u,e)) {
			vertex v = g->mate(u,e);
			if (mEdge[v] == 0) { mEdge[u] = mEdge[v] = e; break; }
		}
	}
	for (edge e = g->first(); e != 0; e = g->next(e)) {
		vertex u = g->left(e); vertex v = g->right(e);
		if (mEdge[u] == 0 && mEdge[v] == 0) mEdge[u] = mEdge[v] = e;
	}

	// now match, as many vertices in vset as possible
	edge e = findPath();
	while (e != 0) { extend(e); e = findPath(); }

	// now, place edges defined by mEdge in match
	match.clear();
	for (vertex u = 1; u <= g->n(); u++) {
		edge e = mEdge[u];
		if (e > 0 && u < g->mate(u,e)) match.addLast(e); 
	}

	// finally, extend to a maximum matching
	matchb_hk(*g, match);
}

p2matchb_t::~p2matchb_t() { delete [] pEdge; delete [] mEdge; }

/** Extend the matching, so it covers at least one more vertex in vset.
 *  @param e is the number of an edge; there are three possible cases;
 *  (1) if e is a matching edge, we flip the edges on the path from e
 *  to the root of its tree; (2) if e connects two even vertices, the
 *  paths to its endpoints' tree roots plus e forms an augmenting path;
 *  (3) otherwise e connects a free vertex to a vertex in the tree and
 *  the tree path plus e forms an augmenting path.
 */
void p2matchb_t::extend(edge e) {
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
	vertex v = g->right(e);
	mEdge[u] = mEdge[v] = e;
	while (pEdge[u] != 0) {
		e = pEdge[u]; u = g->mate(u,e); e = pEdge[u];
		mEdge[u] = e; u = g->mate(u,e); mEdge[u] = e;
	}
	while (pEdge[v] != 0) {
		e = pEdge[v]; v = g->mate(v,e); e = pEdge[v];
		mEdge[v] = e; v = g->mate(v,e); mEdge[v] = e;
	}
}

/** Find an augmenting path.
 *  @return an edge e that defines an augmenting path, or 0 if there is none;
 *  there are three cases:
 *  (1) if e is a matching edge, the path starting from e and leading
 *  to the root of its tree is an augmenting path;
 *  (2) if e connects two even vertices, the paths to its endpoints'
 *  tree roots plus e forms an augmenting path;
 *  (3) otherwise e connects a free vertex to a vertex in the tree and
 *  the tree path plus e forms an augmenting path.
 */
edge p2matchb_t::findPath() {
	enum stype { unreached, odd, even };
	stype state[g->n()+1];
	List q(g->M());

	// initialization
	for (vertex u = 1; u <= g->n(); u++) {
		pEdge[u] = 0; state[u] = unreached;
		if (mEdge[u] == 0 && vset->member(u)) {
			state[u] = even;
			for (edge e = g->firstAt(u); e != 0;
				  e = g->nextAt(u,e)) {
				q.addLast(e);
			}
		}
	}

	while (!q.empty()) {
		edge e = q.first(); q.removeFirst();
		vertex u = (state[g->left(e)] == even ?
				g->left(e) : g->right(e));
		vertex v = g->mate(u,e);
		if (state[v] == odd) continue;
		else if (state[v] == even ||
			 (state[v] == unreached && mEdge[v] == 0))
			return e;
		// state[v] == unreached and v is matched
		vertex w = g->mate(v,mEdge[v]);
		state[v] = odd; pEdge[v] = e;
		state[w] = even; pEdge[w] = mEdge[w];
		if (!vset->member(w)) return pEdge[w];
		for (edge ee = g->firstAt(w); ee != 0;
			  ee = g->nextAt(w,ee)) {
			if (ee != mEdge[w] && !q.member(ee)) q.addLast(ee);
		}
	}
	return 0;
}

} // ends namespace
