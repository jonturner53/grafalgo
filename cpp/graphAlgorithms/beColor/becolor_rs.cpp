/** @file becolor_rs.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Graph_wd.h"
#include "Graph_ff.h"
#include "ecolor_g.h"

namespace grafalgo {
extern int becolorlb_d(Graph_wd&);
extern int becolorlb_m(Graph_wd&);
extern int becolorlb_f(Graph_wd&);
extern bool mflof.cpp(Graph_ff&, string);
extern void buildFlograf(Graph_wd&, int, int, Graph_ff&);

/** Find a bounded edge coloring using the relaxed split method.
 *  @param g is a reference to the graph
 *  @param color is an array indexed by edge numbers which is allocated
 *  by the caller; on return color[e] is the color assigned to edge e
 */
void becolor_rs(Graph_wd& g, int color[]) {
	int bmax = 0;
	for (edge e = g.first(); e != 0; e = g.next(e)) 
		bmax = max(bmax,g.length(e));

	// first find the smallest C for which a split exists
	int hi = bmax + g.maxDegree() - 1;
	int lo = becolorlb_d(g);
	lo = max(lo, becolorlb_m(g));
	lo = max(lo, becolorlb_f(g));
	int k = (bmax+1)/2;
	Graph_ff fg;
	while (lo < hi) {
		int mid = (lo + hi)/2;
		buildFlograf(g,k,mid,fg);
		if (mflof.cpp(fg,"mflo_d")) hi = mid;
		else lo = mid+1;
	}

	// viable split when using hi colors
	// build subgraphs defined by flow, color them and
	// use the colorings to color the edges of g
	buildFlograf(g,k,hi,fg); mflof.cpp(fg,"mflo_d");
	Graph hk(g.n(),g.M()), jk(g.n(),g.M());
	for (edge e = g.first(); e != 0; e = g.next(e)) {
		vertex u = g.tail(e); vertex v = g.head(e);
		if (g.length(e) <= k && fg.f(fg.tail(e),e) == 1) {
			hk.joinWith(u,v,e);
		}
		else jk.joinWith(u,v,e);
	}
	int cc[g.M()+1];
	// first attempt to color edges in hk using colors in 1..k-1
	// color edges according to the degree of their endpoint in
	// the uncolored subgraph of g
	int cc[g.M()+1];
	int d[g.n()+1]; // degrees in uncolored subgraph
	List_d avail[g.n()+1]; // list of available colors
	for (vertex u = 1; u <= g.n(); u++) {
		d[u] = g.degree(u);
		avail[u].resize(bmax+g.maxDegree());
		for (int c = 1; c <= k-1; c++) avail[u].addLast(c);
	}
	Heap_d<int> edges(g.M(),2); // edges ordered by max endpoint degree
	for (edge e = g.first(); e != 0; e = g.next(e)) {
		edges.insert(e,-max(d[g.left(e)], d[g.right(e)]));
	}
	




	ecolor_g(hk, cc);
	for (edge e = hk.first(); e != 0; e = hk.next(e))
		color[e] = cc[e] + (k-1);
	ecolor_g(jk, cc);
	for (edge e = jk.first(); e != 0; e = jk.next(e))
		color[e] = cc[e] + (bmax-1);
}

/** Construct flow graph for determining lower bound.
 *  @param g is a weighted digraph in which the edge lengths represent
 *  lower bounds on edge colors
 *  @param k is the largest bound to consider when constructing fg;
 *  that is, only incorporate edges from g that have bounds <= k
 *  @param C is the target number of colors for lower bound computation
 *  @param fg is a flow graph with min flow requirements, in which the
 *  result is returned
void buildFlograf(Graph_wd& g, int k, int C, Graph_ff& fg) {
	fg.clear(); fg.resize(g.n()*k+2,g.M()+g.n()*k+2);
	fg.setSrc(g.n()*k+1); fg.setSnk(g.n()*k+2);
	// first, build central edges, preserving edge numbers from g
	for (edge e = g.first(); e != 0; e = g.next(e)) {
		vertex u = g.tail(e); vertex v = g.head(e);
		int b = g.length(e);
		if (b > k) continue;
		if (b == 1) fg.joinWith(u,v,e);
		else fg.joinWith(g.n()+(u-1)*(k-1)+(b-1),
				 g.n()+(v-1)*(k-1)+(b-1), e);
		fg.setCapacity(e, 1);
	}
	// now, build remaining edges
	for (vertex u = 1; u <= g.n(); u++) {
		int du = g.degree(u);
		if (g.firstOut(u) != 0) {  // u is an input
			edge e = fg.join(fg.src(), u);
			fg.setCapacity(e, k);
			fg.setMinFlo(e, max(0, du - (C - k)));
			if (k == 1) continue;
			vertex x = g.n()+(u-1)*(k-1)+1;
			int ecap = k-1;
			e = fg.join(u, x); fg.setCapacity(e, ecap--);
			while (x < g.n()+u*(k-1)) {
				e = fg.join(x, x+1); fg.setCapacity(e, ecap--);
				x++;
			}
		} else if (g.firstIn(u) != 0) { // u is an output
			edge e = fg.join(u, fg.snk());
			fg.setCapacity(e, k);
			fg.setMinFlo(e, max(0, du - (C - k)));
			if (k == 1) continue;
			vertex x = g.n()+(u-1)*(k-1)+1;
			int ecap = k-1;
			e = fg.join(x, u); fg.setCapacity(e, ecap--);
			while (x < g.n()+u*(k-1)) {
				e = fg.join(x+1, x); fg.setCapacity(e, ecap--);
				x++;
			}
		}
	}
}
 */

} // ends namespace
