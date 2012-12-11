#include "shortPath.h"

shortPath::shortPath(Flograph& fg1, int& floVal) : augPath(fg1,floVal) {
// Find maximum flow in fg using the shortest augment path algorithm.
	pathCount = basicStepCount = 0;
	floVal = 0;
	while(findPath()) {
		floVal += augment(); 
	}
	cout << "pathCount=" << pathCount
	     << "  basicStepCount=" << basicStepCount << endl;
}

bool shortPath::findPath() {
// Find a shortest path with unused residual capacity.
	vertex u,v; edge e;
	List queue(fg->n());

	pathCount++;

	for (u = 1; u <= fg->n(); u++) pEdge[u] = 0;
	queue.addLast(fg->src());
	while (!queue.empty()) {
		u = queue.first(); queue.removeFirst();
		for (e = fg->firstAt(u); e != 0; e = fg->nextAt(u,e)) {
			basicStepCount++;
			v = fg->mate(u,e);
			if (fg->res(u,e) > 0 && pEdge[v] == 0 && 
			    v != fg->src()) {
				pEdge[v] = e;
				if (v == fg->snk()) return true;
				queue.addLast(v);
			}
		}
	}
	return false;
}
