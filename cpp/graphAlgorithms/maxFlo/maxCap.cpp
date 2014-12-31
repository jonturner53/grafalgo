/** @file maxCap.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "maxCap.h"

namespace grafalgo {

/** Find maximum flow in fg using the max capacity variant of
 *  the augmenting path algorithm.
 *  @param fg1 is a flow graph
 */
maxCap::maxCap(Flograph& fg1) : augPath(fg1) { main(); }

/** Find an augmenting path of maximum capacity.
 *  @return true if a path is found.
 */
bool maxCap::findPath() {
        vertex u, v; edge e;
        Dheap<int> nheap(fg->n(),2+fg->m()/fg->n()); int bcap[fg->n()+1];

        for (u = 1; u <= fg->n(); u++) { pEdge[u] = 0; bcap[u] = 0; }
        bcap[fg->src()] = INT_MAX;
        nheap.insert(fg->src(),-INT_MAX); // so deletemin gives max cap
        while (!nheap.empty()) {
                u = nheap.deletemin();
                for (e = fg->firstAt(u); e != 0; e = fg->nextAt(u,e)) {
                        v = fg->mate(u,e);
			if (min(bcap[u], fg->res(u,e)) > bcap[v]) {
                                bcap[v] = min(bcap[u],fg->res(u,e));
                                pEdge[v] = e;
				if (v == fg->snk()) return true;
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
