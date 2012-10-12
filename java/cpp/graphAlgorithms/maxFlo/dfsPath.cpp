#include "dfsPath.h"

dfsPath::dfsPath(Flograph& fg1, int& floVal) : augPath(fg1,floVal) {
// Find maximum flow in fg using the shortest augment path algorithm.
	floVal = 0;
	while(true) {
		for (vertex u = 1; u <= fg->n(); u++) pEdge[u] = 0;
		if (!findPath()) break;
		floVal += augment(); 
	}
}

bool dfsPath::findPath(vertex u) {
// Find a shortest path with unused residual capacity.
// This version uses depth-first search
	vertex u,v; edge e;

	if (u == fg->snk()) return true;

	for (e = fg->firstAt(u); e != 0; e = fg->nextAt(u,e)) {
		if (e == pEdge[u] || fg->res(u,e) == 0) continue;
		vertex v = fg->mate(u,e);
		if (v != fg->src() && pEdge[v] == 0) {
			pEdge[v] = e;
			if (findPath(v)) return true;
		}
	}
	return false;
}
