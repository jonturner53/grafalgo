// usage: mstUpdate n m maxWt repCount check seed
//
// mstUpdate generates a random graph on n vertices with m edges.
// It then computes a minimum spanning tree of the graph then repeatedly
// modifies the minimimum spanning tree by randomly changing the weight
// of one of the non-tree edges.
//
// If check != 0, each computed mst is checked for correctness.
// Seed is used to initialize the random number generator.
//
// This program is not bullet-proof. Caveat emptor.

#include "stdinc.h"
#include "Partition.h"
#include "Wgraph.h"
#include "UiList.h"
#include "UiClist.h"

extern void kruskal(Wgraph&, UiList&);

void buildpp(Wgraph&, UiList&, edge*);
int mstUpdate(Wgraph&, edge*, edge, int);
void check(Wgraph&, Wgraph&);

main(int argc, char* argv[]) {
	int i, n, m, maxWt, repCount, checkIt, retVal, seed;
	int notZero, minCyc, maxCyc, avgCyc;
	double p;
	edge e, modEdge, *pe;
	vertex u, v;
	Wgraph wg, *mstree2;


	if (argc != 7 ||
	    sscanf(argv[1],"%d",&n) != 1 ||
	    sscanf(argv[2],"%d",&m) != 1 ||
	    sscanf(argv[3],"%d",&maxWt) != 1 ||
	    sscanf(argv[4],"%d",&repCount) != 1 ||
	    sscanf(argv[5],"%d",&checkIt) != 1 ||
	    sscanf(argv[6],"%d",&seed) != 1)
		fatal("usage: mstUpdate n m maxWt repCount check seed");

	srandom(seed);
	wg.rgraph(n,m,n); wg.randWeight(0,maxWt);
	UiList mstree(wg.m());
	kruskal(wg,mstree);

	pe = new edge[wg.m()+1];
	buildpp(wg,mstree,pe);

	notZero = 0; minCyc = wg.n(); maxCyc = 0; avgCyc = 0;
	for (i = 1; i <= repCount; i++) {
		do {
			e = randint(1,wg.m());
		} while (pe[wg.left(e)] == e || pe[wg.right(e)] == e);
		retVal = mstUpdate(wg,pe,e,randint(1,maxWt));
		if (retVal > 0) {
			notZero++;
			minCyc = min(retVal,minCyc);
			avgCyc += retVal;
			maxCyc = max(retVal,maxCyc);
		}
		if (checkIt) {
			mstree2 = new Wgraph(wg.n(),wg.n()-1);
			for (u = 1; u <= wg.n(); u++) {
				e = pe[u];
				if (e != 0) {
					v = wg.mate(u,e);
					edge ee = mstree2->join(u,v);
					mstree2->setWeight(ee,wg.weight(e));
				}
			}
			check(wg,*mstree2);
			delete mstree2;
		}
	}

	printf("%6d %2d %8.2f %4d\n",
		notZero,minCyc,double(avgCyc)/notZero,maxCyc);
}

void buildpp(Wgraph&wg, UiList& mstree, edge *pe) {
// Given a weighted graph data structure wg and a list of edges
// representing a spanning tree of wg, compute a vector of
// parent pointers that represents the same tree. The parent
// pointer vector pe actually stores edge numbers (from wg).
// The edges stored allow us to get to the "other" endpoint
// and its weight.
// 
	vertex u, v; edge e;
	UiList q(wg.n());

	pe[1] = 0; for (u = 2; u <= wg.n(); u++) pe[u] = wg.m()+1;

	q.addLast(1);
	while (!q.empty()) {
		u = q.first(); q.removeFirst();
		for (e = wg.firstAt(u); e != 0; e = wg.nextAt(u,e)) {
			v = wg.mate(u,e);
			if (pe[v] == wg.m()+1 && mstree.member(e)) {
				pe[v] = e; 
				if (!q.member(v)) q.addLast(v);
			}
		}
	}
}

// Given a weighted graph wg and an MST represented by a vector
// of parent pointers p, modify p to reflect the effect of changing
// the weight of modEdge to nuWt.
//
int mstUpdate(Wgraph& wg, edge *pe, edge modEdge, int nuWt) {
	static int n = 0; static char *mark;
	int cycleLen;
	vertex u, v, w, nca, top;
	edge e, bigLeft, bigRight, prevEdge;

	if (wg.n() > n) { // allocate larger mark vector
		if (n > 0) delete [] mark;
		n = wg.n(); mark = new char[n+1];
		for (u = 1; u <= n; u++) mark[u] = 0;
	}

	if (wg.weight(modEdge) <= nuWt) {
		wg.setWeight(modEdge,nuWt); return 0;
	}

	wg.setWeight(modEdge,nuWt);

	// find nca by following parent pointers
	u = wg.left(modEdge); v = wg.right(modEdge); 
	while (1) {
		if (u != v && !mark[u] && !mark[v]) {
			if (pe[u] != 0) { mark[u] = 1; u = wg.mate(u,pe[u]); }
			if (pe[v] != 0) { mark[v] = 1; v = wg.mate(v,pe[v]); }
			continue;
		}
		if (u == v) {
			nca = top = u;
		} else if (mark[u]) {
			nca = u; top = v;
		} else { // mark[v] == 1
			nca = v; top = u;
		}
		break;
	}
	
	// find largest weight edges, calculate cycle length and reset marks
	bigLeft = modEdge; cycleLen = 1;
	for (u = wg.left(modEdge); u != nca; u = wg.mate(u,pe[u])) {
		if (wg.weight(pe[u]) > wg.weight(bigLeft)) bigLeft = pe[u];
		mark[u] = 0; cycleLen++;
	}
	bigRight = modEdge;
	for (v = wg.right(modEdge); v != nca; v = wg.mate(v,pe[v])) {
		if (wg.weight(pe[v]) > wg.weight(bigRight)) bigRight = pe[v];
		mark[v] = 0; cycleLen++;
	}
	while (v != top) { mark[v] = 0; v = wg.mate(v,pe[v]); } mark[v] = 0;

	// if no edge on cycle has larger weight than modEdge, return early
	if (bigLeft == bigRight) return cycleLen;
	
	// Reverse parent pointers
	if (wg.weight(bigLeft) > wg.weight(bigRight)) {
		if (pe[wg.left(bigLeft)] == bigLeft) w = wg.left(bigLeft);
		else w = wg.right(bigLeft);
		u = wg.left(modEdge); prevEdge = modEdge;
		while (u != w) {
			v = wg.mate(u,pe[u]);
			e = pe[u]; pe[u] = prevEdge; prevEdge = e;
			u = v;
		}
		pe[w] = prevEdge;
	} else {
		if (pe[wg.left(bigRight)] == bigRight) w = wg.left(bigRight);
		else w = wg.right(bigRight);
		v = wg.right(modEdge); prevEdge = modEdge;
		while (v != w) {
			u = wg.mate(v,pe[v]);
			e = pe[v]; pe[v] = prevEdge; prevEdge = e;
			v = u;
		}
		pe[w] = prevEdge;
	}
	return cycleLen;
}

void verify(Wgraph&, Wgraph&);
void rverify(Wgraph&, Wgraph&, vertex, vertex, vertex*, UiClist&, vertex*, int*);
int max_wt(vertex, vertex, vertex*, vertex*);
void nca(Wgraph&, Wgraph&, vertex*, UiClist&);
void nca_search(Wgraph&, Wgraph&, vertex, vertex, vertex*,
	UiClist&, Partition&, vertex*, int*);

void check(Wgraph& wg, Wgraph& mstree) {
// Verify that mstree is a minimum spanning tree of wg.
	vertex u,v; edge e, f;

	// check that mstree is a subgraph of wg
	if (mstree.n() != wg.n() || mstree.m() != mstree.n()-1) {
		fatal("check: size error, aborting");
	}
	vertex* edgeTo = new vertex[mstree.n()+1];
	for (u = 1; u <= wg.n(); u++) edgeTo[u] = 0;
	for (u = 1; u <= wg.n(); u++) {
		for (e = wg.firstAt(u); e != 0; e = wg.nextAt(u,e))
			edgeTo[wg.mate(u,e)] = e;
		for (f = mstree.firstAt(u); f != 0; f = mstree.nextAt(u,f)) {
			v = mstree.mate(u,f);
			e = edgeTo[v];
			if (e == 0 || mstree.weight(f) != wg.weight(e))
				fatal("check: edge in mstree is not in wg");
		}
		for (e = wg.firstAt(u); e != 0; e = wg.nextAt(u,e))
			edgeTo[wg.mate(u,e)] = 0;
	}

	// check that mstree reaches all the vertices
	int* mark = new int[mstree.n()+1]; int marked;
	for (u = 1; u <= mstree.n(); u++) mark[u] = 0;
	mark[1] = 1; marked = 1;
	UiList q(wg.n()); q.addLast(1);
	while (!q.empty()) {
		u = q.first(); q.removeFirst();
		for (e = mstree.firstAt(u); e != 0; e = mstree.nextAt(u,e)) {
			v = mstree.mate(u,e);
			if (mark[v] == 0) {
				q.addLast(v); mark[v] = 1; marked++;
			}
		}
	}
	if (marked != mstree.n()) {
		fatal("check: mstree does not reach all vertices\n");
	}
	// check that there is no cheaper spanning tree
	verify(wg,mstree);
	delete [] mark; delete[] edgeTo;
}

void verify(Wgraph& wg, Wgraph& mstree) {
// Verify that there is no cheaper spanning tree than mstree.
	int i, m; vertex u, v; edge e;

	// Determine nearest common ancestor for each edge.
	vertex* first_edge = new edge[wg.n()+1];
	UiClist edge_sets(wg.m());
	nca(wg,mstree,first_edge,edge_sets);

	// Check paths from endpoints to nca, and compress.
	vertex* a = new vertex[mstree.n()+1];  // a[u] is an ancestor of u
	int* mw = new int[mstree.n()+1];	// mw[u] is max edge wt, between u, a[u]
	rverify(wg,mstree,1,1,first_edge,edge_sets,a,mw);

	delete [] first_edge; delete [] a; delete [] mw;
}

// Recursively verify the subtree rooted at u with parent pu.
void rverify(Wgraph& wg, Wgraph& mstree, vertex u, vertex pu,
	    vertex first_edge[], UiClist& edge_sets, vertex a[], int mw[]) {
	vertex v; edge e; int m;
	for (e = mstree.firstAt(u); e != 0; e = mstree.nextAt(u,e)) {
		v = mstree.mate(u,e);
		if (v == pu) continue;
		a[v] = u; mw[v] = mstree.weight(e);
		rverify(wg,mstree,v,u,first_edge,edge_sets,a,mw);
	}
	e = first_edge[u];
	if (e == 0) return;
	while (1) {
		m = max( max_wt(wg.left(e),u,a,mw),
			 max_wt(wg.right(e),u,a,mw) );
		if (m > wg.weight(e)) fatal("mst violation");
		e = edge_sets.suc(e);
		if (e == first_edge[u]) break;
	}
}

// Return the maximum weight of edges on path from u to v,
// defined by the ancestor pointers in a. Compress a & mw as a
// side effect.
int max_wt(vertex u, vertex v, vertex a[], int mw[]) {
	if (u == v) return 0;
	int m = max(mw[u],max_wt(a[u],v,a,mw));
	a[u] = v; mw[u] = m;
	return m;
}
		
// Compute the nearest common ancestors in mstree of edges in wg.
// On return edge_sets contains a collection of lists, with two edges
// appearing on the same list if they have the same nearest common ancestor.
// On return, first_edge[u] is an edge for which u is the nearest common
// ancestor, or null if there is no such edge.
void nca(Wgraph& wg, Wgraph& mstree, vertex *first_edge, UiClist& edge_sets) {
	Partition npap(wg.n());
	vertex *npa = new vertex[wg.n()+1];
	int *mark = new int[wg.m()+1];

	for (edge e = 1; e <= wg.m(); e++) mark[e] = 0;
	for (vertex u = 1; u <= wg.n(); u++) {
		first_edge[u] = 0; npa[u] = u;
	}
	nca_search(wg,mstree,1,1,first_edge,edge_sets,npap,npa,mark);
	delete [] npa; delete [] mark;
}

void nca_search(Wgraph& wg, Wgraph& mstree, vertex u, vertex pu, vertex first_edge[],
	UiClist& edge_sets, Partition& npap, vertex npa[], int mark[]) {
	vertex v, w; edge e;

	for (e = mstree.firstAt(u); e != 0; e = mstree.nextAt(u,e)) {
		v = mstree.mate(u,e);
		if (v == pu) continue;
		nca_search(wg,mstree,v,u,first_edge,edge_sets,npap,npa,mark);
		npap.link(npap.find(u),npap.find(v));
		npa[npap.find(u)] = u;
	}
	for (e = wg.firstAt(u); e != 0; e = wg.nextAt(u,e)) {
		v = wg.mate(u,e);
		if (! mark[e]) mark[e] = 1;
		else {
			w = npa[npap.find(v)];
			edge_sets.join(e,first_edge[w]);
			first_edge[w] = e;
		}
	}
}
		
