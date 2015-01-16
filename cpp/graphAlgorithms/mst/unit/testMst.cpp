/** @file testMst.cpp
 * 
 *  @author Jon Turner
 *  @date 2014
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Glist.h"
#include "Wgraph.h"
#include "ClistSet.h"
#include "Partition.h"

namespace grafalgo {
extern void kruskal(Wgraph&, Glist<edge>&);
extern void prim(Wgraph&, Glist<edge>&);
extern void primF(Wgraph&, Glist<edge>&);
extern void cheritonTarjan(Wgraph&, Glist<edge>&);
}

using namespace grafalgo;

bool checkMst(Wgraph&, Wgraph&);

/** usage: mst method [ show verify ]
 * 
 *  mst reads a graph from stdin and computes its minimum spanning tree
 *  using the method specified by the argument. The total weight of the
 *  tree is then printed
 * 
 *  The method argument is one of kruskal, prim, primF or cheritonTarjan.
 * 
 *  If the show argument (string "show") is present, the original graph
 *  and mst are also printed.
 * 
 *  If the verify argument (string "verify") is present, the mst is
 *  checked for correctness. Error messages are sent to stdout in the
 *  case of an invalid tree.
 */
int main(int argc, char *argv[]) {
	Wgraph g; cin >> g;
	Glist<edge> mst;
	
	if (argc < 2) Util::fatal("usage: testMst method [ show verify]");

	if (strcmp(argv[1],"kruskal") == 0)
		kruskal(g,mst);
	else if (strcmp(argv[1],"prim") == 0)
		prim(g,mst);
	else if (strcmp(argv[1],"primF") == 0)
		primF(g,mst);
	else if (strcmp(argv[1],"cheritonTarjan") == 0)
		cheritonTarjan(g,mst);
	else
		Util::fatal("mst: undefined method");

	int treeweight = 0;
	for (grafalgo::index x = mst.first(); x != 0; x = mst.next(x))
		treeweight += g.weight(mst.value(x));
	cout << "mst weight: " << treeweight << endl;

	// check for show/verify arguments
	bool show = false; bool verify = false;
	for (int i = 2; i < argc; i++) {
		     if (strcmp(argv[i],"show") == 0) show = true;
		else if (strcmp(argv[i],"verify") == 0) verify = true;
	}

	if (show) cout << g << endl << g.elist2string(mst) << endl;
	if (verify) {
		Wgraph mstg(g.n(), g.n()-1);
		for (grafalgo::index x = mst.first(); x != 0; x = mst.next(x)) {
			edge e = mst.value(x);
			edge ee = mstg.join(g.left(e),g.right(e));
			mstg.setWeight(ee, g.weight(e));
		}
		checkMst(g, mstg);
	}
}

bool verify(Wgraph&, Wgraph&);
bool rverify(Wgraph&, Wgraph&, vertex, vertex, vertex*,
	     ClistSet&, vertex*, int*);
int max_wt(vertex, vertex, vertex*, vertex*);
void nca(Wgraph&, Wgraph&, vertex*, ClistSet&);
void nca_search(Wgraph&, Wgraph&, vertex, vertex, vertex*,
	ClistSet&, Partition&, vertex*, int*);


/** Verify that one graph is an MST of another.
 *  @param g is a weighted graph object
 *  @param mstg is second weighted graph that is to be checked
 *  against g; an error message is printed for each discrepancy
 */
bool checkMst(Wgraph& g, Wgraph& mstg) {
	vertex u,v; edge e, f; bool status = true;

	// check that mstg is a subgraph of g
	if (mstg.n() != g.n() || mstg.m() != mstg.n()-1) {
		cout << "check: size error, aborting\n";
		return false;
	}
	vertex* edgeTo = new vertex[mstg.n()+1];
	for (u = 1; u <= g.n(); u++) edgeTo[u] = 0;
	for (u = 1; u <= g.n(); u++) {
		for (e = g.firstAt(u); e != 0; e = g.nextAt(u,e))
			edgeTo[g.mate(u,e)] = e;
		for (f = mstg.firstAt(u); f != 0; f = mstg.nextAt(u,f)) {
			v = mstg.mate(u,f);
			e = edgeTo[v];
			if (e == 0 || mstg.weight(f) != g.weight(e)) {
				cout << "check: edge " << f << "="
				     << mstg.edge2string(f)
				     << " is not in g\n";
				status = false;
			}
		}
		for (e = g.firstAt(u); e != 0; e = g.nextAt(u,e))
			edgeTo[g.mate(u,e)] = 0;
	}

	// check that mstg reaches all the vertices
	int* mark = new int[mstg.n()+1]; int marked;
	for (u = 1; u <= mstg.n(); u++) mark[u] = 0;
	mark[1] = 1; marked = 1;
	List q(g.n()); q.addLast(1);
	while (!q.empty()) {
		u = q.first(); q.removeFirst();
		for (e = mstg.firstAt(u); e != 0; e = mstg.nextAt(u,e)) {
			v = mstg.mate(u,e);
			if (mark[v] == 0) {
				q.addLast(v); mark[v] = 1; marked++;
			}
		}
	}
	if (marked != mstg.n()) {
		printf("check: mst does not reach all vertices\n");
		return false;
	}
	// check that there is no cheaper spanning tree
	if (!verify(g,mstg)) status = false;

	return status;
}

/** Verify that there is no cheaper spanning tree.
 *  Print an error message for each discrepancy found.
 *  @param g is a weighted graph
 *  @param mstg is a second graph that is assumed to be a spanning tree.
 *  @return true if mstg has minimum cost
 */
bool verify(Wgraph& g, Wgraph& mstg) {
	// Determine nearest common ancestor for each edge.
	vertex* first_edge = new edge[g.n()+1];
	ClistSet edge_sets(g.m());
	nca(g,mstg,first_edge,edge_sets);

	// Check paths from endpoints to nca, and compress.
	vertex* a = new vertex[mstg.n()+1];	// a[u] is an ancestor of u
	int* mw = new int[mstg.n()+1];	// mw[u] is max edge wt
						// between u, a[u]
	return rverify(g,mstg,1,1,first_edge,edge_sets,a,mw);
}

/** Recursively verify a subtree
 *  @param g is the graph
 *  @param mstg is the candidate MST
 *  @param u is a vertex
 *  @param pu is the parent of u in mstg
 *  @return true if the subtree can be verified, else false
 */
bool rverify(Wgraph& g, Wgraph& mstg, vertex u, vertex pu,
	    vertex first_edge[], ClistSet& edge_sets, vertex a[], int mw[]) {
	vertex v; edge e; int m; bool status = true;
	for (e = mstg.firstAt(u); e != 0; e = mstg.nextAt(u,e)) {
		v = mstg.mate(u,e);
		if (v == pu) continue;
		a[v] = u; mw[v] = mstg.weight(e);
		if (!rverify(g,mstg,v,u,first_edge,edge_sets,a,mw))
			status = false;
	}
	e = first_edge[u];
	if (e == 0) return status;
	while (true) {
		m = max( max_wt(g.left(e),u,a,mw),
			 max_wt(g.right(e),u,a,mw) );
		if (m > g.weight(e)) {
			cout << "mst violation: edge " << e << "="
			     << g.edge2string(e) << " in g\n";
			status = false;
		}
		e = edge_sets.next(e);
		if (e == first_edge[u]) break;
	}
	return status;
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
 *  @param g is the graph
 *  @param mstg is the candidate MST
 *  @param first_edge[u] is an edge for which u is the nearest common ancestor,
 *  or 0 if there is no such edge
 *  @param edge_sets is used to return a collection of lists that partition
 *  the edges; two edges appear on the same list if they have the same nca
 */
void nca(Wgraph& g, Wgraph& mstg, edge *first_edge, ClistSet& edge_sets) {
	Partition npap(g.n());
	vertex *npa = new vertex[g.n()+1];
	int *mark = new int[g.m()+1];

	for (edge e = g.first(); e != 0; e = g.next(e)) mark[e] = 0;
	for (vertex u = 1; u <= g.n(); u++) {
		first_edge[u] = 0; npa[u] = u;
	}
	nca_search(g,mstg,1,1,first_edge,edge_sets,npap,npa,mark);
}

/** Recursive helper for computing nearest common ancestors of edge endpoints.
 *  @param g is the graph
 *  @param mstg is the candidate MST
 *  @param u is a vertex
 *  @param pu is the parent of u
 *  @param first_edge[u] is an edge for which u is the nearest common ancestor,
 *  or 0 if there is no such edge
 *  @param edge_sets is used to return a collection of lists that partition
 *  the edges; two edges appear on the same list if they have the same nca
 */
void nca_search(Wgraph& g, Wgraph& mstg, vertex u, vertex pu,
		edge first_edge[],
	ClistSet& edge_sets, Partition& npap, vertex npa[], int mark[]) {
	vertex v, w; edge e;

	for (e = mstg.firstAt(u); e != 0; e = mstg.nextAt(u,e)) {
		v = mstg.mate(u,e);
		if (v == pu) continue;
		nca_search(g,mstg,v,u,first_edge,edge_sets,npap,npa,mark);
		npap.link(npap.find(u),npap.find(v));
		npa[npap.find(u)] = u;
	}
	for (e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
		v = g.mate(u,e);
		if (! mark[e]) mark[e] = 1;
		else {
			w = npa[npap.find(v)];
			edge_sets.join(e,first_edge[w]);
			first_edge[w] = e;
		}
	}
}
