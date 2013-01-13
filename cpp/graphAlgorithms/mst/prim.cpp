#include "stdinc.h"
#include "Dheap.h"
#include "Wgraph.h"

using namespace grafalgo;

/** Find a minimum spanning tree using Prim's algorithm.
 *  @param wg is a reference to a weighted graph object
 *  @param mstree is a reference to a list used to return
 *  the edges in the mst; it is assumed to be empty
 */
void prim(Wgraph& wg, list<int>& mstree) {
	vertex u,v; edge e;
	edge *cheap = new edge[wg.n()+1];
	bool *intree = new bool[wg.n()+1];
	Dheap nheap(wg.n(),2+wg.m()/wg.n());

	for (e = wg.firstAt(1); e != 0; e = wg.nextAt(1,e)) {
		u = wg.mate(1,e); nheap.insert(u,wg.weight(e)); cheap[u] = e;
	}
	intree[1] = true;
	for (u = 2; u <= wg.n(); u++) intree[u] = false;
	while (!nheap.empty()) {
		u = nheap.deletemin();
		intree[u] = true; mstree.push_back(cheap[u]);
		for (e = wg.firstAt(u); e != 0; e = wg.nextAt(u,e)) {
			v = wg.mate(u,e);
			if (nheap.member(v) && wg.weight(e) < nheap.key(v)) {
				nheap.changekey(v,wg.weight(e)); cheap[v] = e;
			} else if (!nheap.member(v) && !intree[v]) {
				nheap.insert(v,wg.weight(e)); cheap[v] = e;
			}
		}
	}
	delete [] cheap;
}
