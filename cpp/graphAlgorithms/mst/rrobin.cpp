#include "stdinc.h"
#include "Dlist.h"
#include "Partition.h"
#include "LlheapSet.h"
#include "Wgraph.h"

using namespace grafalgo;

Wgraph *gp;
Partition *pp;

// Return true if the endpoints of e are in same tree.
bool delf(edge e) {
	return (*pp).find((*gp).left((e+1)/2)) ==
	       (*pp).find((*gp).right((e+1)/2));
}

/** Find a minimum spanning tree of wg using the round robin algorithm.
 *  @param wg is a weighted graph
 *  @param mstree is a list in which the edges of the mst are returned;
 *  it is assumed to be empty, initially
 */
void rrobin(Wgraph& wg, list<edge>& mstree) {
	edge e; vertex u,v,cu,cv;
	Dlist q(wg.n()); List elist(2*wg.m());
	lheap *h = new lheap[wg.n()+1];
	Partition prtn(wg.n()); LlheapSet heapSet(2*wg.m(),delf);
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
			h[u] = heapSet.makeheap(elist); q.addLast(u);
		}
	}
	while (q.get(2) != 0) {
		vertex q1 = q.first();	
		h[q1] = heapSet.findmin(h[q1]);
		if (h[q1] == 0) { q.removeFirst(); continue; }
		e = (h[q1]+1)/2; mstree.push_back(e);
		u = wg.left(e); v = wg.right(e);
		cu = prtn.find(u); cv = prtn.find(v);
		q.remove(cu); q.remove(cv);
		h[prtn.link(cu,cv)] = heapSet.lmeld(h[cu],h[cv]);
		q.addLast(prtn.find(u));
	}
	delete [] h;
}
