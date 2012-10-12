#include "stdinc.h"
#include "Wgraph.h"
#include "UiClist.h"
#include "UiList.h"
#include "Fheaps.h"

/** Find a minimum spanning tree using Prim's algorithm.
 *  This version uses a Fibonacci heap
 *  @param wg is a weighted graph
 *  @param mstree is a second weighted graph data structure in which the
 *  the result is to be returned; it is assumed to have no edges
 */
void primF(Wgraph& wg, Wgraph& mstree) {
        vertex u,v; edge e;
        edge* cheap = new edge[wg.n()+1];
        Fheaps nheap(wg.n()); fheap root;
        bool *inHeap = new bool[wg.n()+1]; // inHeap[u]=true if u is in heap
        int numInHeap = 0;

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

        while (numInHeap > 0) {
                u = root; root = nheap.deletemin(root);
                inHeap[u] = false; numInHeap--;
                e = mstree.join(wg.left(cheap[u]),wg.right(cheap[u]));
                mstree.setWeight(e,wg.weight(cheap[u]));
                for (e = wg.firstAt(u); e != 0; e = wg.nextAt(u,e)) {
                        v = wg.mate(u,e);
                        if (inHeap[v] && wg.weight(e) < nheap.key(v)) {
                                root = nheap.decreasekey(v,nheap.key(v) -
                                                             wg.weight(e),root);
                                cheap[v] = e;
                        } else if (!inHeap[v] && mstree.firstAt(v) == 0) {
                                root = nheap.insert(v,root,wg.weight(e));
                                cheap[v] = e;
                                inHeap[v] = true; numInHeap++;
                        }
                }
        }
        delete [] cheap; delete [] inHeap;
}
