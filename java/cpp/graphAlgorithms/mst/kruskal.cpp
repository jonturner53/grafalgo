#include "stdinc.h"
#include "Partition.h"
#include "Wgraph.h"
#include "UiList.h"

// Sort edges according to weight, using heap-sort.
void sortEdges(edge *elist, const Wgraph& wg) {
        int i, p, c; edge e; weight w;

        for (i = wg.m()/2; i >= 1; i--) {
                // do pushdown starting at i
                e = elist[i]; w = wg.weight(e); p = i;
                while (1) {
                        c = 2*p;
                        if (c > wg.m()) break;
                        if (c+1 <= wg.m() &&
			    wg.weight(elist[c+1]) >= wg.weight(elist[c]))
				c++;
                        if (wg.weight(elist[c]) <= w) break;
			elist[p] = elist[c]; p = c;
                }
		elist[p] = e;
        }
        // now edges are in heap-order with largest weight edge on top

        for (i = wg.m()-1; i >= 1; i--) {
		e = elist[i+1]; elist[i+1] = elist[1];
                // now largest edges in positions wg.m(), wg.m()-1,..., i+1
                // edges in 1,...,i form a heap with largest weight edge on top
                // pushdown from 1
                w = wg.weight(e); p = 1;
                while (1) {
                        c = 2*p;
                        if (c > i) break;
                        if (c+1 <= i &&
			    wg.weight(elist[c+1]) >= wg.weight(elist[c]))
				c++;
                        if (wg.weight(elist[c]) <= w) break;
			elist[p] = elist[c]; p = c;
                }
		elist[p] = e;
        }
}

// Find a minimum spanning tree of wg using Kruskal's algorithm and
// return it in mstree.
void kruskal(Wgraph& wg, Wgraph& mstree) {
	edge e, e1; vertex u,v,cu,cv; weight w;
	class Partition vsets(wg.n());
	edge *elist = new edge[wg.m()+1];
	int i = 1;
	for (e = wg.first(); e != 0; e = wg.next(e)) elist[i++] = e;
	sortEdges(elist,wg);
	for (e1 = 1; e1 <= wg.m(); e1++) {
		e = elist[e1];
		u = wg.left(e); v = wg.right(e); w = wg.weight(e);
		cu = vsets.find(u); cv = vsets.find(v);
		if (cu != cv) {
			vsets.link(cu,cv);
			e = mstree.join(u,v); mstree.setWeight(e,w);
		}
	}
}

void kruskal(Wgraph& wg, UiList& mstree) {
// Find a minimum spanning tree of wg using Kruskal's algorithm and
// return it in mstree. This version returns a list of the edges using
// the edge numbers in wg, rather than a separate Wgraph data structure.
	edge e, e1; vertex u,v,cu,cv; weight w;
	Partition vsets(wg.n());
	edge *elist = new edge[wg.m()+1];
	int i = 1;
	for (e = wg.first(); e != 0; e = wg.next(e)) elist[i++] = e;
	sortEdges(elist,wg);
	for (e1 = wg.first(); e1 != 0; e1 = wg.next(e1)) {
		e = elist[e1];
		u = wg.left(e); v = wg.right(e); w = wg.weight(e);
		cu = vsets.find(u); cv = vsets.find(v);
		if (cu != cv) {
			 vsets.link(cu,cv); mstree.addLast(e);
		}
	}
}
