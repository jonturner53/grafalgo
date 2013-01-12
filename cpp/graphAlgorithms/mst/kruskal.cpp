#include "stdinc.h"
#include "Partition.h"
#include "Wgraph.h"
#include "List.h"

using namespace grafalgo;

/** Sort edges according to weight, using heap-sort.
 *  @param wg is a weighted graph
 *  @param elist is a pointer to an array of containing all the
 *  edge numbers in wg; on return the edges in elist are sorted
 *  by weight; that is, wg.weight(elist[i]) <= wg.weight(elist[i+1])
 */
void sortEdges(const Wgraph& wg, edge *elist) {
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

/** Find a minimum spanning tree of wg using Kruskal's algorithm.
 *  @param wg is a weighted graph
 *  @param mstree is a list in which the mst is returned; it is assumed
 *  to be empty
 */
void kruskal(Wgraph& wg, list<edge>& mstree) {
	edge e, e1; vertex u,v,cu,cv; weight w;
	Partition vsets(wg.n());
	edge *elist = new edge[wg.m()+1];
	int i = 1;
	for (e = wg.first(); e != 0; e = wg.next(e)) elist[i++] = e;
	sortEdges(wg,elist);
	for (e1 = wg.first(); e1 != 0; e1 = wg.next(e1)) {
		e = elist[e1];
		u = wg.left(e); v = wg.right(e);
		cu = vsets.find(u); cv = vsets.find(v);
		if (cu != cv) {
			 vsets.link(cu,cv); mstree.push_back(e);
		}
	}
}
