/** @file maxCap.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "maxCap.h"

/** Find maximum flow using the max capacity variant of the
 *  augmenting path algorithm.
 *  @param fg1 is a reference to the flograph for which a max flow is
 *  required; on return, the flow fields of the flow graph contain
 *  the max flow
 *  @param floVal is a reference to an integer in which the value of
 *  the resulting flow is returned
 */
maxCap::maxCap(Flograph& fg1,int& floVal) : augPath(fg1,floVal) {
	floVal = 0;
	while(findPath()) floVal += augment(); 
}

/** Find a path with unused residual capacity.
 *  @return true if a path was found, else false
 */
bool maxCap::findPath() {
        vertex u, v; edge e;
        Dheap nheap(fg->n(),2+fg->m()/fg->n()); int bcap[fg->n()+1];

        for (u = 1; u <= fg->n(); u++) { pEdge[u] = 0; bcap[u] = 0; }
        bcap[fg->src()] = Util::BIGINT32;
        nheap.insert(fg->src(),-Util::BIGINT32); // store negative values, 
				    // so deletemin gives max cap
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
