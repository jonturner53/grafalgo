/** @file match_egc.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "match_egc.h"

namespace grafalgo {

/** Constructor for core of Edmonds-Gabow algorithm.
 *  @param g1 is an undirected graph
 *  @param match is a list in which the matching is returned
 */
match_egc::match_egc(Graph& g1) : g(&g1) {
	blossoms = new Djsets_flt(g->n()); // set per blossom
	augpath = new Djsets_rl(g->M());    // reversible list
	origin = new vertex[g->n()+1];    // original vertex for each blossom
	bridge = new BridgePair[g->n()+1];// edge that formed a blossom
	state = new stype[g->n()+1];	     // state used in path search
	pEdge = new edge[g->n()+1];	     // edge to parent in tree
	mEdge = new edge[g->n()+1];	     // incident matching edge (if any)
	mark = new bool[g->n()+1];	     // mark bits used by nca
}

match_egc::~match_egc() {
	delete blossoms; delete augpath; delete [] origin;
	delete [] bridge; delete [] pEdge; delete [] mEdge; delete[] mark;
}

/** Augment the matching.
 *  @param e is the "last" edge in the augmenting path
 */
void match_egc::augment(edge e) {
	while (true) {
		edge e1 = augpath->first(e);
		mEdge[g->left(e1)] = mEdge[g->right(e1)] = e1;
		if (e == augpath->first(e)) { return; }
		e = augpath->pop(e); e = augpath->pop(e);
	}
}

/** Find the nearest common ancestor of two vertices in
 *  the current "condensed graph".
 *  To avoid excessive search time, search upwards from both vertices in
 *  parallel, using mark bits to identify the nca. Before returning,
 *  clear the mark bits by traversing the paths a second time.
 *  The mark bits are initialized in the constructor.
 *  @param u is an external vertex or the base of a blossom
 *  @param v is another external vertex or the base of a blossom
 *  @param return the nearest common ancestor of u and v or 0 if none
 */
vertex match_egc::nca(vertex u, vertex v) {
	vertex result;

	// first pass to find the nca
	vertex x = u; vertex y = v;
	while (true) {
		if (x == y) { result = x; break; }
		if (mark[x]) { result = x; break; }
		if (mark[y]) { result = y; break; }
		if (pEdge[x] == 0 && pEdge[y] == 0) { result = 0; break; }
		if (pEdge[x] != 0) {
			mark[x] = true;
			x = g->mate(x,pEdge[x]);
 			x = base(g->mate(x,pEdge[x]));
		}
		if (pEdge[y] != 0) {
			mark[y] = true;
			y = g->mate(y,pEdge[y]);
			y = base(g->mate(y,pEdge[y]));
		}
	}
	// second pass to clear mark bits
	x = u;
	while (mark[x]) {
		mark[x] = false;
		x = g->mate(x,pEdge[x]); x = base(g->mate(x,pEdge[x]));
	}
	y = v;
	while (mark[y]) {
		mark[y] = false;
		y = g->mate(y,pEdge[y]); y = base(g->mate(y,pEdge[y]));
	}
	return result;
}

/** Find path joining two vertices in the same tree.
 *  @param a is a matched vertex in some tree defined by parent
 *  pointers
 *  @param b is an ancestor of a
 *  @return the ab-path that starts with the matching edge incident to a;
 *  specifically, return the index of the id of the list of vertices in
 *  the path using the augpath object
 */
edge match_egc::path(vertex a, vertex b) {
	if (a == b) return 0;
	if (state[a] == even) {
		edge e1 = pEdge[a];  vertex pa = g->mate(a,e1);
		if (pa == b) return e1;
		edge e2 = pEdge[pa]; vertex p2a = g->mate(pa,e2);
		edge e = augpath->join(e1,e2);
		e = augpath->join(e,path(p2a,b));
		return e;
	} else {
		edge e = bridge[a].e; vertex da = bridge[a].v;
		e = augpath->join(augpath->reverse(path(da,a)),e);
		e = augpath->join(e,path(g->mate(da,e),b));
		return e;
	}
}

/** Find the root of a tree.
 *  @vertex vp is either an external vertex or the base of some blossom
 *  @return the root of the tree containing vp
 */
vertex match_egc::root(vertex vp) {
	vertex rv = vp;
	while (pEdge[rv] != 0) {
		rv = g->mate(rv,pEdge[rv]); rv = base(g->mate(rv,pEdge[rv]));
	}
	return rv;
}

} // ends namespace
