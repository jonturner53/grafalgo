/** @file checkMst.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "List.h"
#include "ClistSet.h"
#include "Wgraph.h"
#include "Partition.h"

using namespace grafalgo;

void checkMst(Wgraph&, Wgraph&);
void verify(Wgraph&, Wgraph&);
void rverify(Wgraph&, Wgraph&, vertex, vertex, vertex*,
	     ClistSet&, vertex*, int*);
int max_wt(vertex, vertex, vertex*, vertex*);
void nca(Wgraph&, Wgraph&, vertex*, ClistSet&);
void nca_search(Wgraph&, Wgraph&, vertex, vertex, vertex*,
	ClistSet&, Partition&, vertex*, int*);


/** usage:
 * 	checkMst
 * 
 *  CheckMst reads two graphs from stdin, and checks to see
 *  if the second is a minimum spanning tree of the first.
 *  It prints a message for each discrepancy that it finds.
 */
int main() {
	Wgraph wg; cin >> wg;
	Wgraph mstree; cin >> mstree;
	checkMst(wg,mstree);
}

/** Verify that one graph is an MST of another.
 *  @param wg is a weighted graph object
 *  @param mstree is second weighted graph that is to be checked
 *  against wg; an error message is printed for each discrepancy
 */
void checkMst(Wgraph& wg, Wgraph& mstree) {
	vertex u,v; edge e, f;

	// check that mstree is a subgraph of wg
	if (mstree.n() != wg.n() || mstree.m() != mstree.n()-1) {
		Util::fatal("check: size error, aborting\n");
	}
	vertex* edgeTo = new vertex[mstree.n()+1];
	for (u = 1; u <= wg.n(); u++) edgeTo[u] = 0;
	for (u = 1; u <= wg.n(); u++) {
		for (e = wg.firstAt(u); e != 0; e = wg.nextAt(u,e))
			edgeTo[wg.mate(u,e)] = e;
		for (f = mstree.firstAt(u); f != 0; f = mstree.nextAt(u,f)) {
			v = mstree.mate(u,f);
			e = edgeTo[v];
			if (e == 0 || mstree.weight(f) != wg.weight(e)) {
				cout << "check: edge " << f << "="
				     << mstree.edge2string(f)
				     << " is not in wg\n";
			}
		}
		for (e = wg.firstAt(u); e != 0; e = wg.nextAt(u,e))
			edgeTo[wg.mate(u,e)] = 0;
	}

	// check that mstree reaches all the vertices
	int* mark = new int[mstree.n()+1]; int marked;
	for (u = 1; u <= mstree.n(); u++) mark[u] = 0;
	mark[1] = 1; marked = 1;
	List q(wg.n()); q.addLast(1);
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
		printf("check: mstree does not reach all vertices\n");
		return;
	}
	// check that there is no cheaper spanning tree
	verify(wg,mstree);
}

/** Verify that there is no cheaper spanning tree.
 *  Print an error message for each discrepancy found.
 *  @param wg is a weighted graph
 *  @param mstree is a second graph that is assumed to be a spanning tree.
 */
void verify(Wgraph& wg, Wgraph& mstree) {
	// Determine nearest common ancestor for each edge.
	vertex* first_edge = new edge[wg.n()+1];
	ClistSet edge_sets(wg.m());
	nca(wg,mstree,first_edge,edge_sets);

	// Check paths from endpoints to nca, and compress.
	vertex* a = new vertex[mstree.n()+1];	// a[u] is an ancestor of u
	int* mw = new int[mstree.n()+1];	// mw[u] is max edge wt
						// between u, a[u]
	rverify(wg,mstree,1,1,first_edge,edge_sets,a,mw);
}

/** Recursively verify a subtree
 *  @param wg is the graph
 *  @param mstree is the candidate MST
 *  @param u is a vertex
 *  @param pu is the parent of u in mstree
 */
void rverify(Wgraph& wg, Wgraph& mstree, vertex u, vertex pu,
	    vertex first_edge[], ClistSet& edge_sets, vertex a[], int mw[]) {
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
		if (m > wg.weight(e)) {
			cout << "mst violation: edge " << e << "="
			     << wg.edge2string(e) << " in wg\n";
		}
		e = edge_sets.suc(e);
		if (e == first_edge[u]) break;
	}
}

/** Return the maximum weight of edges on a path.
 *  Performs path compression as a side-effect.
 *  @param u is a vertex
 *  @param v is an ancestor of u
 *  @param a contains ancestor pointers used to speed path searches
 *  @param mw[x] is the maximum weight on the path from a vertex x
 *  to its ancestor a[x]
 */
int max_wt(vertex u, vertex v, vertex a[], int mw[]) {
	if (u == v) return 0;
	int m = max(mw[u],max_wt(a[u],v,a,mw));
	a[u] = v; mw[u] = m;
	return m;
}
		
/** Compute nearest common ancestors of edge endpoints.
 *  @param wg is the graph
 *  @param mstree is the candidate MST
 *  @param first_edge[u] is an edge for which u is the nearest common ancestor,
 *  or 0 if there is no such edge
 *  @param edge_sets is used to return a collection of lists that partition
 *  the edges; two edges appear on the same list if they have the same nca
 */
void nca(Wgraph& wg, Wgraph& mstree, edge *first_edge, ClistSet& edge_sets) {
	Partition npap(wg.n());
	vertex *npa = new vertex[wg.n()+1];
	int *mark = new int[wg.m()+1];

	for (edge e = wg.first(); e != 0; e = wg.next(e)) mark[e] = 0;
	for (vertex u = 1; u <= wg.n(); u++) {
		first_edge[u] = 0; npa[u] = u;
	}
	nca_search(wg,mstree,1,1,first_edge,edge_sets,npap,npa,mark);
}

/** Recursive helper for computing nearest common ancestors of edge endpoints.
 *  @param wg is the graph
 *  @param mstree is the candidate MST
 *  @param u is a vertex
 *  @param pu is the parent of u
 *  @param first_edge[u] is an edge for which u is the nearest common ancestor,
 *  or 0 if there is no such edge
 *  @param edge_sets is used to return a collection of lists that partition
 *  the edges; two edges appear on the same list if they have the same nca
 */
void nca_search(Wgraph& wg, Wgraph& mstree, vertex u, vertex pu,
		edge first_edge[],
	ClistSet& edge_sets, Partition& npap, vertex npa[], int mark[]) {
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
