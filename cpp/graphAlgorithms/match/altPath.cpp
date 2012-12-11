#include "altPath.h"

using namespace grafalgo;

// Find a maximum size matching in the bipartite graph graf and
// return it as a list of edges. Return the number of edges
// in the matching in size.
altPath::altPath(Graph& graf1, Dlist& match1, int& size)
		 : graf(&graf1), match(&match1) {
	pEdge = new edge[graf->n()+1];
	
	edge e;
	size = 0;
	while((e = findPath()) != 0) { augment(e); size++; }

	delete [] pEdge;
}

// Modify the matching by augmenting along the path defined by
// the edge e and the pEdge pointers.
void altPath::augment(edge e) {
	vertex u; edge ee;

	u = graf->left(e);
	while (pEdge[u] != 0) {
		ee = pEdge[u]; match->remove(ee);  u = graf->mate(u,ee); 
		ee = pEdge[u]; match->addLast(ee); u = graf->mate(u,ee); 
	}
	u = graf->right(e);
	while (pEdge[u] != 0) {
		ee = pEdge[u]; match->remove(ee);  u = graf->mate(u,ee); 
		ee = pEdge[u]; match->addLast(ee); u = graf->mate(u,ee); 
	}
	match->addLast(e);
}

// Search for an augmenting path in the bipartite graph graf.
// Return the edge that joins two separate trees in the forest
// defined by pEdge. This edge, together with the paths
// to the tree roots is an augmenting path.
//
edge altPath::findPath() {
	vertex u,v,w,x,y; edge e, f;
	enum stype { unreached, odd, even };
	stype state[graf->n()+1];
	edge mEdge[graf->n()+1];  // mEdge[u] = matching edge incident to u

	for (u = 1; u <= graf->n(); u++) {
		state[u] = even; mEdge[u] = pEdge[u] = 0;
	}

	for (e = match->first(); e != 0; e = match->next(e)) {
		u = graf->left(e); v = graf->right(e);
		state[u] = state[v] = unreached;
		mEdge[u] = mEdge[v] = e;
	}
	List q(graf->m());
	for (e = graf->first(); e != 0; e = graf->next(e)) {
		if (state[graf->left(e)] == even ||
		    state[graf->right(e)] == even)
			q.addLast(e);
	}

	while (!q.empty()) {
		e = q.first(); q.removeFirst();
		v = (state[graf->left(e)] == even ?
			graf->left(e) : graf->right(e));
		w = graf->mate(v,e);
		if (state[w] == unreached && mEdge[w] != 0) {
			x = graf->mate(w,mEdge[w]);
			state[w] = odd; pEdge[w] = e;
			state[x] = even; pEdge[x] = mEdge[x];
			for (f = graf->firstAt(x); f != 0;
			     f = graf->nextAt(x,f)) {
				if ((f != mEdge[x]) && !q.member(f))
					q.addLast(f);
			}
		} else if (state[w] == even) {
			for (x = w; pEdge[x] != 0; x = graf->mate(x,pEdge[x])){}
			for (y = v; pEdge[y] != 0; y = graf->mate(y,pEdge[y])){}
			if (x == y) Util::fatal("findpath: graph not bipartite");
			return e;
		}
	}
	return 0;
}
