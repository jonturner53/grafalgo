/** @file mst_p.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "List_g.h"
#include "Graph_w.h"
#include "Mheaps_f.h"

namespace grafalgo {

/** Find a minimum spanning tree using Prim's algorithm.
 *  This version uses a Fibonacci heap
 *  @param wg is a weighted graph
 *  @param mst is a list in which the edge numbers for the edges in
 *  the the minimum spanning tree are returned
 */
void mst_pf(Graph_w& wg, List_g<edge>& mst) {
        vertex u,v; edge e;
        edge* cheap = new edge[wg.n()+1];
        Mheaps_f nheap(wg.n()); fheap root;
        bool *inHeap = new bool[wg.n()+1]; // inHeap[u]=true if u is in heap
        bool *inTree = new bool[wg.n()+1]; // inTree[u]=true if u is in tree
        int numInHeap = 0;

	mst.clear();
        for (u = 1; u <= wg.n(); u++) inHeap[u] = false;

        e = wg.firstAt(1);
        if (e == 0) return;
        root = wg.mate(1,e);
        do {
                u = wg.mate(1,e); 
                root = nheap.insert(u,root,wg.weight(e)); 
                cheap[u] = e;
                inHeap[u] = true; numInHeap++;
                e = wg.nextAt(1,e);
        } while (e != 0);
	inTree[1] = true;
	for (u = 2; u <= wg.n(); u++) inTree[u] = false;
        while (numInHeap > 0) {
                u = root; root = nheap.deletemin(root);
                inHeap[u] = false; numInHeap--;
		inTree[u] = true; mst.addLast(cheap[u]);
                for (e = wg.firstAt(u); e != 0; e = wg.nextAt(u,e)) {
                        v = wg.mate(u,e);
                        if (inHeap[v] && wg.weight(e) < nheap.key(v)) {
                                root = nheap.decreasekey(v,nheap.key(v) -
                                                             wg.weight(e),root);
                                cheap[v] = e;
                        } else if (!inHeap[v] && !inTree[v]) {
                                root = nheap.insert(v,root,wg.weight(e));
                                cheap[v] = e;
                                inHeap[v] = true; numInHeap++;
                        }
                }
        }
        delete [] cheap; delete [] inHeap;
}

} // ends namespace
