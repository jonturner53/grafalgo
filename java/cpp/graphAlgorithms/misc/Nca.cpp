#include "Nca.h"

Nca::Nca(Graph& t, vertex root1, VertexPair pairs1[], int np1, int ncav1[])
	   : tp(&t), root(root1), pairs(pairs1), np(np1), ncav(ncav1) {
// Compute the nearest common ancestor in t relative to root of
// all vertex pairs in the vector "pairs". Pair[i]=(pair[i].v1,pair[i].v2)
// is the i-th pair. Np is the number of pairs. On return Ncav[i] is
// the nearest common ancestor of the vertices in pair[i].

	gp = new Graph(tp->n(),np);
	for (int i = 0; i < np; i++) gp->join(pairs[i].v1, pairs[i].v2);
	// note: edges are allocated sequentially from 1,
	// so edge i+1 corresponds to pair i

	pp = new Partition(tp->n());
	noa = new vertex[tp->n()+1];
	state = new state_t[tp->n()+1];
	for (vertex u = 1; u <= tp->n(); u++) state[u] = unreached;

	compute_nca(root,root);

	delete gp; delete pp; delete [] noa; delete [] state;
}

void Nca::compute_nca(vertex u, vertex pu) {
// Recursive search, where u is current vertex and pu is its parent
// (except on the top level call when pu=u).
	vertex v; edge e;

	state[u] = open;
	for (e = tp->firstAt(u); e != 0; e = tp->nextAt(u,e)) {
		v = tp->mate(u,e); if (v == pu) continue;
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
