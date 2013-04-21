#include "edmondsBWmin.h"

using namespace grafalgo;

/** Find a maximum weighted matching in a bipartite graph.
 *  @param graf1 is a reference to a bipartite graph
 *  @param match1 is a reference to a list of edges in which
 *  result is returned
 *  @param size is a reference to an integer in which the size
 *  of the matching is returned
 */
edmondsBWmin::edmondsBWmin(Wgraph& graf1, Dlist& match1, int& size, int& weight)
		 : graf(&graf1), match(&match1) {
	state = new stype[graf->n()+1];
	mEdge = new edge[graf->n()+1];
	pEdge = new edge[graf->n()+1];
	z = new double[graf->n()+1];

	int maxe = 0; maxwt = -graf->weight(graf->first());
	for (edge e = graf->first(); e != 0; e = graf->next(e)) {
		graf->setWeight(e,-graf->weight(e));
		maxe = max(e,maxe); maxwt = max(graf->weight(e),maxwt);
	}
	h1o = new Ddheap(graf->n(),2); h1e = new Ddheap(graf->n(),2);
	h2 = new Ddheap(maxe,2); h3 = new Ddheap(maxe,2);

	for (vertex u = 1; u <= graf->n(); u++) z[u] = maxwt/2.0;
	
	edge e; size = 0; weight = 0;
	while((e = findpath()) != 0) { weight -= augment(e); size++; }

	// restore original edge weights
	for (edge e = graf->first(); e != 0; e = graf->next(e))
		graf->setWeight(e,-graf->weight(e));

	delete [] state; delete [] mEdge;
	delete [] pEdge; delete [] z;
	delete h1o; delete h1e; delete h2; delete h3;
}

/** Augment the current matching, using the forest built by findpath.
 *  @param e is an edge joining two trees in the forest built by
 *  findpath
 */
double edmondsBWmin::augment(edge e) {
	vertex u = graf->left(e);
	double pathWeight = 0;;
	while (pEdge[u] != 0) {
		edge ee;
		ee = pEdge[u]; match->remove(ee);  u = graf->mate(u,ee); 
		pathWeight -= graf->weight(ee);
		ee = pEdge[u]; match->addLast(ee); u = graf->mate(u,ee); 
		pathWeight += graf->weight(ee);
	}
	vertex v = graf->right(e);
	while (pEdge[v] != 0) {
		edge ee;
		ee = pEdge[v]; match->remove(ee);  v = graf->mate(v,ee); 
		pathWeight -= graf->weight(ee);
		ee = pEdge[v]; match->addLast(ee); v = graf->mate(v,ee); 
		pathWeight += graf->weight(ee);
	}
	if (u == v) Util::fatal("edmondsBWmin::augment: graph not bipartite");
	match->addLast(e);
	pathWeight += graf->weight(e);
	return pathWeight;
}

/** Search for an augmenting path in the bipartite graph graf.
 *  @return the edge that joins two separate trees in the forest
 *  defined by pEdge; this edge, together with the paths
 *  to the tree roots forms an augmenting path; return 0 if
 *  no augmenting path, or if the current matching has maximum weight
 */
edge edmondsBWmin::findpath() {
	for (vertex u = 1; u <= graf->n(); u++) {
		state[u] = even; mEdge[u] = pEdge[u] = 0;
	}

	for (edge e = match->first(); e != 0; e = match->next(e)) {
		vertex u = graf->left(e); vertex v = graf->right(e);
		state[u] = state[v] = unreached;
		mEdge[u] = mEdge[v] = e;
	}
	for (vertex u = 1; u <= graf->n(); u++) {
		if (state[u] == even) h1e->insert(u,z[u]);
	}
	if (h1e->size() < 2) return 0;
	for (edge e = graf->first(); e != 0; e = graf->next(e)) {
		vertex u = graf->left(e);
		vertex v = graf->right(e);
		if (state[u] == even || state[v] == even) {
			if (state[u] != state[v])
				h2->insert(e,z[u]+z[v]-graf->weight(e));
			else
				h3->insert(e,z[u]+z[v]-graf->weight(e));
		}
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
			vertex v = (state[graf->left(e)] == even ?
					graf->left(e) : graf->right(e));
			vertex w = graf->mate(v,e);
			vertex x = graf->mate(w,mEdge[w]);
			state[w] = odd; pEdge[w] = e;
			state[x] = even; pEdge[x] = mEdge[x];
			h1e->insert(x,z[x]); h1o->insert(w,z[w]);

			// remove edges at w from h2 if present
			for (edge ee = graf->firstAt(w); ee != 0;
				  ee = graf->nextAt(w,ee)) {
				if (h2->member(ee)) h2->remove(ee);
			}

			// add edges at x to h3, and remove from h2 as needed
			for (edge ee = graf->firstAt(x); ee != 0;
			     	  ee = graf->nextAt(x,ee)) {
				if (ee == mEdge[x]) continue;
				vertex y = graf->mate(x,ee);
				if (state[y] == unreached && !h2->member(ee)) {
					h2->insert(ee,z[x]+z[y]
							-graf->weight(ee));
				} else if (state[y] == even) {
					h2->remove(ee);
					z[y] = h1e->key(y);
					h3->insert(ee,z[x]+z[y]
							-graf->weight(ee));
				}
			}
			continue;
		}
		// relabel
		double delta; 
		if (h2->empty() && h3->empty()) return 0;
		if (h2->empty()) delta = h3->key(h3->findmin())/2;
		else if (h3->empty()) delta = h2->key(h2->findmin());
		else delta = min(h2->key(h2->findmin()),
				 h3->key(h3->findmin())/2);
		h1e->addtokeys(-delta); h1o->addtokeys(delta);
		h2->addtokeys(-delta); h3->addtokeys(-2*delta);
	}
}
