/** @file Nca.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Nca.h"

namespace grafalgo {

/** Compute nearest common ancestors of specified pairs of vertices.
 *  @param t is a reference to a graph object that is a tree
 *  @param root1 is the root of the tree
 *  @param g is a graph defined on the same vertex set as t;
 *  the edges of g define the pairs for which the nca is to be computed
 *  @param ncav1 is an array used to return the nca values; on return,
 *  ncav1[e] is the nearest common ancestor of the pair defined by edge e;
 *  the size of ncav1 is assumed to be at least g.M()+1
 */
Nca::Nca(Graph& t, vertex root1, Graph& g, vertex ncav1[])
	   : tp(&t), root(root1), gp(&g), ncav(ncav1) {

	pp = new Djsets_flt(tp->n());
	noa = new vertex[tp->n()+1];
	state = new state_t[tp->n()+1];
	for (vertex u = 1; u <= tp->n(); u++) state[u] = unreached;

	compute_nca(root,0);

	delete pp; delete [] noa; delete [] state;
}

/** Recursive computation of nca values.
 *  @param u is the current vertex in the recursive computation
 *  @param pu is the parent of u; in the top-level call pu==0
 */
void Nca::compute_nca(vertex u, vertex pu) {
	vertex v; edge e;

	state[u] = open;
	// recursively visit the children of u in the tree
	for (e = tp->firstAt(u); e != 0; e = tp->nextAt(u,e)) {
		v = tp->mate(u,e);
		if (v == pu) continue;
		compute_nca(v,u);
		// now u is nearest open ancestor of vertices in v's subtree
		pp->link(pp->find(u),pp->find(v));
		noa[pp->find(u)] = u;
	}
	// examine pairs that include u and assign nca value for those
	// pairs for which the other endpoint is closed
	for (e = gp->firstAt(u); e != 0; e = gp->nextAt(u,e)) {
		v = gp->mate(u,e);
		if (state[v] == closed)
			ncav[e] = noa[pp->find(v)];
	}
	state[u] = closed;
}


/*
Seems phony to use graph in this way. Also, the way results are
returned is obscure.

For returning results, might make more sense to use an array (or list)
Pair<Pair<vertex,vertex>,vertex> to pass in the pairs and return
result.

To eliminate graph, we need a list of pairs for each vertex.
Could replicate the use of Djsets_cl used in graphs.
*/

} // ends namespace
