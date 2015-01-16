/** @file kruskal.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Partition.h"
#include "Wgraph.h"
#include "Glist.h"

namespace grafalgo {

/** Sort edges according to weight, using heap-sort.
 *  @param g is a weighted graph
 *  @param elist is a pointer to an array of containing all the
 *  edge numbers in g; on return the edges in elist are sorted
 *  by weight; that is, g.weight(elist[i]) <= g.weight(elist[i+1])
 */
void sortEdges(const Wgraph& g, edge *elist) {
        int i, p, c; edge e; edgeWeight w;

        for (i = g.m()/2; i >= 1; i--) {
                // do pushdown starting at i
                e = elist[i]; w = g.weight(e); p = i;
                while (1) {
                        c = 2*p;
                        if (c > g.m()) break;
                        if (c+1 <= g.m() &&
			    g.weight(elist[c+1]) >= g.weight(elist[c]))
				c++;
                        if (g.weight(elist[c]) <= w) break;
			elist[p] = elist[c]; p = c;
                }
		elist[p] = e;
        }
        // now edges are in heap-order with largest weight edge on top

        for (i = g.m()-1; i >= 1; i--) {
		e = elist[i+1]; elist[i+1] = elist[1];
                // now largest edges in positions g.m(), g.m()-1,..., i+1
                // edges in 1,...,i form a heap with largest weight edge on top
                // pushdown from 1
                w = g.weight(e); p = 1;
                while (1) {
                        c = 2*p;
                        if (c > i) break;
                        if (c+1 <= i &&
			    g.weight(elist[c+1]) >= g.weight(elist[c]))
				c++;
                        if (g.weight(elist[c]) <= w) break;
			elist[p] = elist[c]; p = c;
                }
		elist[p] = e;
        }
}

/** Find a minimum spanning tree of g using Kruskal's algorithm.
 *  @param g is a weighted graph
 *  @param mst is a list in which the mst is returned; it is assumed
 *  to be empty
 */
void kruskal(Wgraph& g, Glist<edge>& mst) {
	edge e, e1; vertex u,v,cu,cv;
	Partition vsets(g.n());
	edge *elist = new edge[g.m()+1];
	mst.clear();
	int i = 1;
	for (e = g.first(); e != 0; e = g.next(e)) elist[i++] = e;
	sortEdges(g,elist);
	for (e1 = g.first(); e1 != 0; e1 = g.next(e1)) {
		e = elist[e1];
		u = g.left(e); v = g.right(e);
		cu = vsets.find(u); cv = vsets.find(v);
		if (cu != cv) {
			 vsets.link(cu,cv); mst.addLast(e);
		}
	}
}

} // ends namespace
