#include "stdinc.h"
#include "Dheap.h"
#include "Wgraph.h"

using namespace grafalgo;

void prim(Wgraph& wg, Wgraph& mstree) {
// Find a minimum spanning tree of wg using Prim's
// algorithm and return its in mstree.
	vertex u,v; edge e;
	edge *cheap = new edge[wg.n()+1];
	//Dheap nheap(wg.n(),2);
	Dheap nheap(wg.n(),2+wg.m()/wg.n());
	nheap.clearStats();

	for (e = wg.firstAt(1); e != 0; e = wg.nextAt(1,e)) {
		u = wg.mate(1,e); nheap.insert(u,wg.weight(e)); cheap[u] = e;
	}
	while (!nheap.empty()) {
		u = nheap.deletemin();
		e = mstree.join(wg.left(cheap[u]),wg.right(cheap[u]));
		mstree.setWeight(e,wg.weight(cheap[u]));
		for (e = wg.firstAt(u); e != 0; e = wg.nextAt(u,e)) {
			v = wg.mate(u,e);
			if (nheap.member(v) && wg.weight(e) < nheap.key(v)) {
				nheap.changekey(v,wg.weight(e)); cheap[v] = e;
			} else if (!nheap.member(v) && mstree.firstAt(v) == 0) {
				nheap.insert(v,wg.weight(e)); cheap[v] = e;
			}
		}
	}
	//string s;
	//cerr << nheap.stats2string(s) << endl;
	delete [] cheap;
}
