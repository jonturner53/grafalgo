package algoLib.graphAlgorithms.mst;

import algoLib.misc.Util;
import algoLib.dataStructures.graphs.Wgraph;
import algoLib.dataStructures.heaps.Dheap;

// Find a minimum spanning tree of wg using Prim's
// algorithm and return its in mstree.
public class Prim {
	public static void algo(Wgraph wg, Wgraph mstree) {
		int u,v; int e;
		int [] cheap = new int[wg.n()+1];
		Dheap nheap = new Dheap(wg.n(),2+wg.m()/wg.n());
	
		for (e = wg.firstAt(1); e != 0; e = wg.nextAt(1,e)) {
			u = wg.mate(1,e);
			nheap.insert(u,wg.weight(e));
			cheap[u] = e;
		}
		while (!nheap.empty()) {
			u = nheap.deletemin();
			e = mstree.join(wg.left(cheap[u]),wg.right(cheap[u]));
			mstree.setWeight(e,wg.weight(cheap[u]));
			for (e = wg.firstAt(u); e != 0; e = wg.nextAt(u,e)) {
				v = wg.mate(u,e);
				if (nheap.member(v) &&
				    wg.weight(e) < nheap.key(v)) {
					nheap.changekey(v,wg.weight(e));
					cheap[v] = e;
				} else if (!nheap.member(v) &&
					   mstree.firstAt(v) == 0) {
					nheap.insert(v,wg.weight(e));
					cheap[v] = e;
				}
			}
		}
	}
}
