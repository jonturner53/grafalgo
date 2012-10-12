#include "faltPath.h"

faltPath::faltPath(Graph& graf1, UiDlist& match1, int& size) : graf(&graf1), match(&match1) {
// Find a maximum size matching in the bipartite graph graf and
// return it as a list of edges. Return the number of edges
// in the mapping in size.
	int sNum; vertex u, v; edge e;

	state = new stype[graf->n()+1]; visit = new int[graf->n()+1];
	mEdge = new edge[graf->n()+1]; pEdge = new edge[graf->n()+1];
	free = new UiDlist(graf->n()); leaves = new UiList(graf->n());

	match->clear(); size = 0;
	for (u = 1; u <= graf->n(); u++) { visit[u] = 0; mEdge[u] = 0; }
	// Build initial matching
	for (e = graf->first(); e != 0; e = graf->next(e)) {
		u = graf->left(e); v = graf->right(e);
		if (mEdge[u] == 0 && mEdge[v] == 0) {
			match->addLast(e); mEdge[u] = mEdge[v] = e; size++;
		}
	}
	for (u = 1; u <= graf->n(); u++) {
		if (mEdge[u] == 0) free->addLast(u);
	}
	
	sNum = 0;
	while((e = findPath()) != 0) { augment(e); size++; }

	delete [] state; delete [] visit; delete [] mEdge;
	delete [] pEdge; delete free; delete leaves;
}

// Modify the matching by augmenting along the path defined by
// the edge e and the pEdge pointers.
void faltPath::augment(edge e) {
	vertex u, v; edge ee;

	u = graf->left(e);
	while (pEdge[u] != 0) {
		ee = pEdge[u]; match->remove(ee); v = graf->mate(u,ee);
		ee = pEdge[v]; match->addLast(ee); u = graf->mate(v,ee); 
		mEdge[u] = mEdge[v] = ee;
	}
	free->remove(u);
	u = graf->right(e);
	while (pEdge[u] != 0) {
		ee = pEdge[u]; match->remove(ee); v = graf->mate(u,ee);
		ee = pEdge[v]; match->addLast(ee); u = graf->mate(v,ee); 
		mEdge[u] = mEdge[v] = ee;
	}
	free->remove(u); match->addLast(e);
	mEdge[graf->left(e)] = mEdge[graf->right(e)] = e;
}

edge faltPath::findPath() {
// Search for an augmenting path in the bipartite graph graf.
// Return the edge that joins two separate trees in the forest
// defined by pEdge. This edge, together with the paths
// to the tree roots is an augmenting path. SNum is the
// index of the current search.
	vertex u; edge e;

	sNum++;
	for (u = free->first(); u != 0; u = free->next(u)) {
		visit[u] = sNum; state[u] = even; pEdge[u] = 0;
	}
	leaves->clear();
	for (u = free->first(); u != 0; u = free->next(u)) {
		if ((e = expand(u)) != 0) return e;
	}
	while (!leaves->empty()) {
		u = leaves->first(); leaves->removeFirst();
		if ((e = expand(u)) != 0) return e;
	}
	return 0;
}

// Expand the forest at vertex v. If we find an edge connecting
// to another tree, return it.
edge faltPath::expand(vertex v) {
	vertex w, x, y; edge e;

	for (e = graf->firstAt(v); e != 0; e = graf->nextAt(v,e)) {
		if (e == mEdge[v]) continue;
		w = graf->mate(v,e);
		if (visit[w] < sNum) {
			x = graf->mate(w,mEdge[w]);
			visit[w] = visit[x] = sNum;
			state[w] = odd; pEdge[w] = e;
			state[x] = even; pEdge[x] = mEdge[x];
			leaves->addLast(x);
		} else if (state[w] == even) {
			for (x = w; pEdge[x] != 0; x = graf->mate(x,pEdge[x])){}
			for (y = v; pEdge[y] != 0; y = graf->mate(y,pEdge[y])){}
			if (x == y) fatal("findPath: graph not bipartite");
			return e;
		} 
	}
	return 0;
}
