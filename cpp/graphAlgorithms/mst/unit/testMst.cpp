/** @file testMst.cpp
 * 
 *  @author Jon Turner
 *  @date 2014
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "List_g.h"
#include "Graph_w.h"
#include "Djsets_cl.h"
#include "Djsets_flt.h"

namespace grafalgo {
extern void mst_k(Graph_w&, List_g<edge>&);
extern void mst_p(Graph_w&, List_g<edge>&);
extern void mst_pf(Graph_w&, List_g<edge>&);
extern void mst_ct(Graph_w&, List_g<edge>&);
}

using namespace grafalgo;

bool checkMst(Graph_w&, Graph_w&);

/** usage: mst method [ show verify ]
 * 
 *  mst reads a graph from stdin and computes its minimum spanning tree
 *  using the method specified by the argument. The total weight of the
 *  tree is then printed
 * 
 *  The method argument is one of mst_k, mst_p, mst_pF or mst_ct.
 * 
 *  If the show argument (string "show") is present, the original graph
 *  and mst are also printed.
 * 
 *  If the verify argument (string "verify") is present, the mst is
 *  checked for correctness. Error messages are sent to stdout in the
 *  case of an invalid tree.
 */
int main(int argc, char *argv[]) {
	Graph_w g; cin >> g;
	List_g<edge> mst;
	
	if (argc < 2) Util::fatal("usage: testMst method [ show verify]");

	if (strcmp(argv[1],"mst_k") == 0)
		mst_k(g,mst);
	else if (strcmp(argv[1],"mst_p") == 0)
		mst_p(g,mst);
	else if (strcmp(argv[1],"mst_pf") == 0)
		mst_pf(g,mst);
	else if (strcmp(argv[1],"mst_ct") == 0)
		mst_ct(g,mst);
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
		Graph_w mstg(g.n(), g.n()-1);
		for (grafalgo::index x = mst.first(); x != 0; x = mst.next(x)) {
			edge e = mst.value(x);
			edge ee = mstg.join(g.left(e),g.right(e));
			mstg.setWeight(ee, g.weight(e));
		}
		checkMst(g, mstg);
	}
}

bool verify(Graph_w&, Graph_w&);
bool rverify(Graph_w&, Graph_w&, vertex, vertex, vertex*,
	     Djsets_cl&, vertex*, int*);
int max_wt(vertex, vertex, vertex*, vertex*);
void nca(Graph_w&, Graph_w&, vertex*, Djsets_cl&);
void nca_search(Graph_w&, Graph_w&, vertex, vertex, vertex*,
	Djsets_cl&, Djsets_flt&, vertex*, int*);


/** Verify that one graph is an MST of another.
 *  @param g is a weighted graph object
 *  @param mstg is second weighted graph that is to be checked
 *  against g; an error message is printed for each discrepancy
 */
bool checkMst(Graph_w& g, Graph_w& mstg) {
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
bool verify(Graph_w& g, Graph_w& mstg) {
	// Determine nearest common ancestor for each edge.
	vertex* first_edge = new edge[g.n()+1];
	Djsets_cl edge_sets(g.m());
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
bool rverify(Graph_w& g, Graph_w& mstg, vertex u, vertex pu,
	    vertex first_edge[], Djsets_cl& edge_sets, vertex a[], int mw[]) {
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
void nca(Graph_w& g, Graph_w& mstg, edge *first_edge, Djsets_cl& edge_sets) {
	Djsets_flt npap(g.n());
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
void nca_search(Graph_w& g, Graph_w& mstg, vertex u, vertex pu,
		edge first_edge[],
	Djsets_cl& edge_sets, Djsets_flt& npap, vertex npa[], int mark[]) {
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
