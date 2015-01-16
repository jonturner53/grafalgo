/** @file ffMaxCap.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "ffMaxCap.h"

namespace grafalgo {

/** Find maximum flow in g using the max capacity variant of
 *  the augmenting path algorithm.
 *  @param g1 is a flow graph
 */
ffMaxCap::ffMaxCap(Flograph& g1) : fordFulkerson(g1) { main(); }

/** Find an augmenting path of maximum capacity.
 *  @return true if a path is found.
 */
bool ffMaxCap::findPath() {
        vertex u, v; edge e;
        Dheap<int> nheap(g->n(),2+g->m()/g->n()); int bcap[g->n()+1];

        for (u = 1; u <= g->n(); u++) { pEdge[u] = 0; bcap[u] = 0; }
        bcap[g->src()] = INT_MAX;
        nheap.insert(g->src(),-INT_MAX); // so deletemin gives max cap
        while (!nheap.empty()) {
                u = nheap.deletemin();
                for (e = g->firstAt(u); e != 0; e = g->nextAt(u,e)) {
                        v = g->mate(u,e);
			if (min(bcap[u], g->res(u,e)) > bcap[v]) {
                                bcap[v] = min(bcap[u],g->res(u,e));
                                pEdge[v] = e;
				if (v == g->snk()) return true;
				if (nheap.member(v))
					nheap.changekey(v,-bcap[v]);
				else
                                	nheap.insert(v,-bcap[v]);
                        }
                }
        }
	return false;
}

} // ends namespace
