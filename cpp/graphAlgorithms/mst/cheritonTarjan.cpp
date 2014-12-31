/** @file cheritonTarjan.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Dlist.h"
#include "Glist.h"
#include "Partition.h"
#include "LlheapSet.h"
#include "Wgraph.h"

namespace grafalgo {

Wgraph *gp;	// pointer to graph, used by delf function
Partition *pp;  // pointer to partition of vertices, used by delf function

/** Determine if an edge joins two vertices in the same tree.
 *  @param e is an edge in the graph.
 *  @return true if both endpoints of e are in the same tree
 */
bool delf(edge e) {
	return pp->find(gp->left((e+1)/2)) == pp->find(gp->right((e+1)/2));
}

/** Find a minimum spanning tree of wg using the round robin algorithm.
 *  @param wg is a weighted graph
 *  @param mstree is a list in which the edges of the mst are returned;
 *  it is assumed to be empty, initially
 */
void cheritonTarjan(Wgraph& wg, Glist<edge>& mstree) {
	edge e; vertex u,v,cu,cv;
	Dlist q(wg.n()); List elist(2*wg.m());
	lheap *h = new lheap[wg.n()+1];
	Partition prtn(wg.n());
	LlheapSet heapSet(2*wg.m(),delf);
	gp = &wg; pp = &prtn;
	for (e = 1; e <= wg.m(); e++) {
		heapSet.setkey(2*e,wg.weight(e));
		heapSet.setkey(2*e-1,wg.weight(e));
	}
	for (u = 1; u <= wg.n(); u++) {
		elist.clear();
		for (e = wg.firstAt(u); e != 0; e = wg.nextAt(u,e)) {
			elist.addLast(2*e - (u == wg.left(e)));
		}
		if (!elist.empty()) {
			h[u] = heapSet.heapify(elist);
			q.addLast(u);
		}
	}
	while (q.get(2) != 0) {
		vertex q1 = q.first();	
		h[q1] = heapSet.findmin(h[q1]);
		if (h[q1] == 0) { q.removeFirst(); continue; }
		e = (h[q1]+1)/2; mstree.addLast(e);
		u = wg.left(e); v = wg.right(e);
		cu = prtn.find(u); cv = prtn.find(v);
		q.remove(cu); q.remove(cv);
		h[prtn.link(cu,cv)] = heapSet.lmeld(h[cu],h[cv]);
		q.addLast(prtn.find(u));
	}
	delete [] h;
}

} // ends namespace
