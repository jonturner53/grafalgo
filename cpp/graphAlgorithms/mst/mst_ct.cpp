/** @file mst_ct.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "List_d.h"
#include "List_g.h"
#include "Djsets_flt.h"
#include "Djheaps_ll.h"
#include "Graph_w.h"

namespace grafalgo {

Graph_w *gp;	// pointer to graph, used by delf function
Djsets_flt *pp;  // pointer to partition of vertices, used by delf function

/** Determine if an edge joins two vertices in the same tree.
 *  @param e is an edge in the graph.
 *  @return true if both endpoints of e are in the same tree
 */
bool delf(edge e) {
	return pp->find(gp->left((e+1)/2)) == pp->find(gp->right((e+1)/2));
}

/** Find a minimum spanning tree using the Cheriton-Tarjan algorithm.
 *  @param g is a weighted graph
 *  @param mst is a list in which the edges of the mst are returned;
 *  it is assumed to be empty, initially
 */
void mst_ct(Graph_w& g, List_g<edge>& mst) {
	edge e; vertex u,v,cu,cv;
	List_d q(g.n()); List elist(2*g.m());
	lheap *h = new lheap[g.n()+1];
	Djsets_flt prtn(g.n());
	Djheaps_ll heapSet(2*g.m(),delf);
	gp = &g; pp = &prtn;
	for (e = 1; e <= g.m(); e++) {
		heapSet.setkey(2*e,g.weight(e));
		heapSet.setkey(2*e-1,g.weight(e));
	}
	for (u = 1; u <= g.n(); u++) {
		elist.clear();
		for (e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			elist.addLast(2*e - (u == g.left(e)));
		}
		if (!elist.empty()) {
			h[u] = heapSet.heapify(elist);
			q.addLast(u);
		}
	}
	mst.clear();
	while (q.get(2) != 0) {
		vertex q1 = q.first();	
		h[q1] = heapSet.findmin(h[q1]);
		if (h[q1] == 0) { q.removeFirst(); continue; }
		e = (h[q1]+1)/2; mst.addLast(e);
		u = g.left(e); v = g.right(e);
		cu = prtn.find(u); cv = prtn.find(v);
		q.remove(cu); q.remove(cv);
		h[prtn.link(cu,cv)] = heapSet.lmeld(h[cu],h[cv]);
		q.addLast(prtn.find(u));
	}
	delete [] h;
}

} // ends namespace
