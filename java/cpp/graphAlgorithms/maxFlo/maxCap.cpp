#include "maxCap.h"

maxCap::maxCap(Flograph& fg1,int& floVal) : augPath(fg1,floVal) {
// Find maximum flow in fg using the shortest augment path algorithm.
	floVal = 0;
	while(findPath()) floVal += augment(); 
}

bool maxCap::findPath() {
// Find a path with unused residual capacity.
        vertex u, v; edge e;
        Dheap nheap(fg->n(),2+fg->m()/fg->n()); int bcap[fg->n()+1];

        for (u = 1; u <= fg->n(); u++) { pEdge[u] = Null; bcap[u] = 0; }
        bcap[fg->src()] = BIGINT;
        nheap.insert(fg->src(),-BIGINT); // store negative values, 
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
