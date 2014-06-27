#include "stdinc.h"
#include "Dheap.h"
#include "Wdigraph.h"

using namespace grafalgo;

void dijkstra(Wdigraph& dig, vertex u, vertex p[], int d[]) {
// Find a shortest path tree of dig using Dijkstra's algorithm
// and return it in p as an array of parent pointers, with
// d giving the shortest path distances.
	vertex v,w; edge e;
	Dheap<int> nheap(dig.n(),4);

	for (v = 1; v <= dig.n(); v++) { p[v] = 0; d[v] = Util::BIGINT32; }
	d[u] = 0; nheap.insert(u,0);
	while (!nheap.empty()) {
		v = nheap.deletemin();
		for (e = dig.firstOut(v); e != 0; e = dig.nextOut(v,e)) {
			w = dig.head(e);
			if (d[w] > d[v] + dig.length(e)) {
				d[w] = d[v] + dig.length(e); p[w] = v;
				if (nheap.member(w)) nheap.changekey(w,d[w]);
				else nheap.insert(w,d[w]);
			}
		}
	}
	return;
}
