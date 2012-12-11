#include "stdinc.h"
#include "Partition.h"
#include "Wgraph.h"
#include "List.h"

using namespace grafalgo;

// Sort edges according to weight, using heap-sort.
void sortEdges(edge *elist, const Wgraph& wg) {
	int i, p, c; edge e; weight w;

	for (i = wg.m()/2; i >= 1; i--) {
		// do pushdown starting at i
		e = elist[i]; w = wg.weight(e); p = i;
		while (1) {
			c = p << 1;
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
			c = p << 1;
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

/** Setup heap.
 *  Create a heap-ordered list of edges.
 *  @param elist is an array in which the heap-ordered list is returned;
 *  on completion elist[1..wg.m()] defines a permutation on the edges;
 *  the weights satisfy the heap-ordering condition for a binary heap
 *  @param wg is a weighted undirected graph
 */
void setupHeap(edge *elist, const Wgraph& wg) {
	int i, p, c; edge e; weight w;
	i = 1;
	for (e = wg.first(); e != 0; e = wg.next(e)) elist[i++] = e;

	for (i = wg.m()/2; i >= 1; i--) {
		// do pushdown starting at i
		e = elist[i]; w = wg.weight(e); p = i;
		while (1) {
			c = 2*p;
			if (c > wg.m()) break;
			if (c+1 <= wg.m() &&
			    wg.weight(elist[c+1]) < wg.weight(elist[c]))
				c++;
			if (wg.weight(elist[c]) >= w) break;
			elist[p] = elist[c]; p = c;
		}
		elist[p] = e;
	}
}

/** Delete and return edge with lightest weight in the heap.
 *  @param elist is a heap-ordered array.
 *  on completion elist[1..wg.m()] defines a permutation on the edges;
 *  the weights satisfy the heap-ordering condition for a binary heap
 *  @param wg is a weighted undirected graph
 */
int deleteMin(edge *elist, int last, const Wgraph& wg) {
	if (last < 1) return 0;
	int result = elist[1]; edge e = elist[last];
	weight w = wg.weight(e);
	vertex c, p; p = 1;
	while (1) {
		c = 2*p;
		if (c > last-1) break;
		if (c+1 < last && wg.weight(elist[c+1]) < wg.weight(elist[c]))
			c++;
		if (wg.weight(elist[c]) >= w) break;
		elist[p] = elist[c]; p = c;
	}
	elist[p] = e;
	return result;
}

// Find a minimum spanning tree of wg using Kruskal's algorithm and
// return it in mstree.
void kruskal(Wgraph& wg, Wgraph& mstree,
	     uint32_t& setupTime, uint32_t& treeTime,
	     int& numLoops,
	     long long int& findCount, int noOpt) {
	uint32_t t1 = Util::getTime();
	edge e, e1; vertex u,v,cu,cv; weight w;
	edge *elist = new edge[wg.m()+1];
	setupHeap(elist,wg);
	uint32_t t2 = Util::getTime();
	Partition vsets(wg.n(),noOpt);
	int k = 0; int i = 0;
	while (k < wg.n()-1) {
		e = deleteMin(elist,wg.m()-(i++),wg);
		u = wg.left(e); v = wg.right(e); w = wg.weight(e);
		cu = vsets.find(u); cv = vsets.find(v);
		if (cu != cv) {
			vsets.link(cu,cv);
			e = mstree.join(u,v); mstree.setWeight(e,w);
			k++;
		}
	}
	numLoops = i;
	uint32_t t3 = Util::getTime();
	setupTime = t2-t1; treeTime = t3-t2; findCount = vsets.findcount();
}

void kruskal(Wgraph& wg, List& mstree) {
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
