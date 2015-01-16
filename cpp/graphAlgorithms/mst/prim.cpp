/** @file prim.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Dheap.h"
#include "Wgraph.h"
#include "Glist.h"

namespace grafalgo {

/** Find a minimum spanning tree using Prim's algorithm.
 *  @param g is a reference to a weighted graph object
 *  @param mst is a reference to a list used to return
 *  the edges in the mst; it is assumed to be empty
 */
void prim(Wgraph& g, Glist<edge>& mst) {
	vertex u,v; edge e;
	edge *cheap = new edge[g.n()+1];
	bool *intree = new bool[g.n()+1];
	Dheap<int> nheap(g.n(),2+g.m()/g.n());

	mst.clear();
	for (e = g.firstAt(1); e != 0; e = g.nextAt(1,e)) {
		u = g.mate(1,e); nheap.insert(u,g.weight(e)); cheap[u] = e;
	}
	intree[1] = true;
	for (u = 2; u <= g.n(); u++) intree[u] = false;
	while (!nheap.empty()) {
		u = nheap.deletemin();
		intree[u] = true; mst.addLast(cheap[u]);
		for (e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			v = g.mate(u,e);
			if (nheap.member(v) && g.weight(e) < nheap.key(v)) {
				nheap.changekey(v,g.weight(e)); cheap[v] = e;
			} else if (!nheap.member(v) && !intree[v]) {
				nheap.insert(v,g.weight(e)); cheap[v] = e;
			}
		}
	}
	delete [] cheap; delete [] intree;
}

} // ends namespace
