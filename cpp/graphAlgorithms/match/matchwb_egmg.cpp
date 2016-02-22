#include "matchwb_egmg.h"

namespace grafalgo {

/** Find a maximum weighted matching in a bipartite graph, using
 *  Galil, Micali and Gabow's implementation of Edmonds' algorithm.
 *  @param[in] g is a graph
 *  @param[in,out] matchingEdge[u] is (on return) the matching edge incident
 *  to u or 0 if us is unmatched; if matchingEdge is not all 0 initially,
 *  it is assumed to represent a valid initial matching
 */
matchwb_egmg::matchwb_egmg(const Graph_w& g, edge *matchingEdge)
			 : gp(&g), mEdge(matchingEdge) {
	state = new stype[gp->n()+1];
	pEdge = new edge[gp->n()+1];
	z = new double[gp->n()+1];

	h1o = new Heap_dd<double>(gp->n(),2);
	h1e = new Heap_dd<double>(gp->n(),2);
	h2 = new Heap_dd<double>(gp->M(),2);
	h3 = new Heap_dd<double>(gp->M(),2);

	maxwt = 0;
	for (edge e = gp->first(); e != 0; e = gp->next(e))
		maxwt = max(gp->weight(e),maxwt);
	for (vertex u = 1; u <= gp->n(); u++) {
		mEdge[u] = 0; z[u] = maxwt/2.0;
	}
	
	edge e;
	while((e = findpath()) != 0) { augment(e); }

	delete [] state; delete [] pEdge; delete [] z;
	delete h1o; delete h1e; delete h2; delete h3;
}

/** Augment the current matching, using the path found by findpath.
 *  @param[in] e is an edge joining two trees in the forest built by
 *  findpath; the path joining the tree roots that passes through e
 *  is an augmenting path
 */
double matchwb_egmg::augment(edge e) {
	vertex u = gp->left(e);
	double pathWeight = 0;;
	mEdge[u] = 0;
	while (pEdge[u] != 0) {
		edge ee;
		ee = pEdge[u]; pathWeight -= gp->weight(ee);
		u = gp->mate(u,ee); 
		ee = pEdge[u]; pathWeight += gp->weight(ee);
		mEdge[u] = ee; u = gp->mate(u,ee); mEdge[u] = ee;
	}
	vertex v = gp->right(e);
	mEdge[v] = 0;
	while (pEdge[v] != 0) {
		edge ee;
		ee = pEdge[v]; pathWeight -= gp->weight(ee);
		v = gp->mate(v,ee); 
		ee = pEdge[v]; pathWeight += gp->weight(ee);
		mEdge[v] = ee; v = gp->mate(v,ee); mEdge[v] = ee;
	}
	if (u == v) Util::fatal("matchwb_egmg::augment: graph not bipartite");
	pathWeight += gp->weight(e);
	mEdge[gp->left(e)] = mEdge[gp->right(e)] = e;
	return pathWeight;
}

/** Search for an augmenting path.
 *  @return the edge that joins two separate trees in the forest
 *  defined by pEdge; this edge, together with the paths
 *  to the tree roots forms an augmenting path; return 0 if
 *  no augmenting path, or if the current matching has maximum weight
 */
edge matchwb_egmg::findpath() {
	for (vertex u = 1; u <= gp->n(); u++) {
		state[u] = even; pEdge[u] = 0;
		edge e = mEdge[u];
		if (e == 0) h1e->insert(u,z[u]);
		else state[u] = unreached;
	}

	if (h1e->size() < 2) return 0;
	for (edge e = gp->first(); e != 0; e = gp->next(e)) {
		vertex u = gp->left(e); vertex v = gp->right(e);
		if (state[u] == even && state[v] == even)
			h3->insert(e,z[u]+z[v]-gp->weight(e));
		else if (state[u] == even || state[v] == even)
			h2->insert(e,z[u]+z[v]-gp->weight(e));
	}

	while (true) {
		if (!h3->empty() && h3->key(h3->findmin()) == 0) {
			edge e = h3->findmin();
			// update labels for vertices in heaps
			while (!h1e->empty()) {
				vertex u = h1e->findmin();
				z[u] = h1e->key(u);
				h1e->deletemin();
			}
			while (!h1o->empty()) {
				vertex u = h1o->findmin();
				z[u] = h1o->key(u);
				h1o->deletemin();
			}
			h2->clear(); h3->clear();
			return e;
		}
		if (!h2->empty() && h2->key(h2->findmin()) == 0) {
			edge e = h2->deletemin();
			vertex v = (state[gp->left(e)] == even ?
					gp->left(e) : gp->right(e));
			vertex w = gp->mate(v,e);
			vertex x = gp->mate(w,mEdge[w]);
			state[w] = odd; pEdge[w] = e;
			state[x] = even; pEdge[x] = mEdge[x];
			h1e->insert(x,z[x]); h1o->insert(w,z[w]);

			// remove edges at w from h2 if present
			for (edge ee = gp->firstAt(w); ee != 0;
				  ee = gp->nextAt(w,ee)) {
				if (h2->member(ee)) h2->remove(ee);
			}

			// add edges at x to h3, and remove from h2 as needed
			for (edge ee = gp->firstAt(x); ee != 0;
			     	  ee = gp->nextAt(x,ee)) {
				if (ee == mEdge[x]) continue;
				vertex y = gp->mate(x,ee);
				if (state[y] == unreached && !h2->member(ee)) {
					h2->insert(ee,z[x]+z[y]
							-gp->weight(ee));
				} else if (state[y] == even) {
					h2->remove(ee);
					z[y] = h1e->key(y);
					h3->insert(ee,z[x]+z[y]
							-gp->weight(ee));
				}
			}
			continue;
		}
		// relabel
		double delta = h1e->key(h1e->findmin());
		if (delta == 0) return 0; // current matching is max weight
		if (!h2->empty()) delta = min(delta,h2->key(h2->findmin()));
		if (!h3->empty()) delta = min(delta,h3->key(h3->findmin())/2);
		h1e->addtokeys(-delta); h1o->addtokeys(delta);
		h2->addtokeys(-delta); h3->addtokeys(-2*delta);
	}
}

} // ends namespace
