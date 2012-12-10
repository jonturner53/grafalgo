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
 *  @param pairs1 is an array of VertexPair structures that identify the
 *  pairs of vertices for which we compute ncas
 *  @param np1 is the number of pairs in pairs1
 *  @param ncav1 is an array in which the nca values are returned
 */
Nca::Nca(Graph& t, vertex root1, VertexPair pairs1[], int np1, int ncav1[])
	   : tp(&t), root(root1), pairs(pairs1), np(np1), ncav(ncav1) {

	gp = new Graph(tp->n(),np);
	for (int i = 0; i < np; i++) gp->join(pairs[i].v1, pairs[i].v2);
	// note: edges are allocated sequentially from 1,
	// so edge i+1 corresponds to pair i

	pp = new Partition(tp->n());
	noa = new vertex[tp->n()+1];
	state = new state_t[tp->n()+1];
	for (vertex u = 1; u <= tp->n(); u++) state[u] = unreached;

	compute_nca(root,0);

	delete gp; delete pp; delete [] noa; delete [] state;
}

/** Recursive computation of nca values.
 *  @param u is the current vertex in the recursive computation
 *  @param pu is the parent of u; in the top-level call pu==0
 */
void Nca::compute_nca(vertex u, vertex pu) {
	vertex v; edge e;

	state[u] = open;
	for (e = tp->firstAt(u); e != 0; e = tp->nextAt(u,e)) {
		v = tp->mate(u,e);
		if (v == pu) continue;
		compute_nca(v,u);
		pp->link(pp->find(u),pp->find(v));
		noa[pp->find(u)] = u;
	}
	for (e = gp->firstAt(u); e != 0; e = gp->nextAt(u,e)) {
		v = gp->mate(u,e);
		if (state[v] == closed)
			ncav[e-1] = noa[pp->find(v)];
	}
	state[u] = closed;
}

} // ends namespace
