#include "capScale.h"

capScale::capScale(Flograph& fg1, int& floVal) : augPath(fg1,floVal) {
// Find maximum flow in fg using the shortest augment path algorithm.
	// initialize scale factor to largest power of 2
	// that is <= (max edge capacity)/2
	edge e; int maxCap = 0;
	for (e = fg->first(); e != 0; e = fg->next(e)) 
		maxCap = max(maxCap,fg->cap(fg->tail(e),e));
	for (scale = 1; scale <= maxCap/2; scale *= 2) {}   
	floVal = 0;
	while(findPath()) floVal += augment(); 
}

bool capScale::findPath() {
// Find a path with sufficient unused residual capacity.
	vertex u,v; edge e;
	UiList queue(fg->n());

	while (scale > 0) {
		for (u = 1; u <= fg->n(); u++) pEdge[u] = Null;
		queue.addLast(fg->src());
		while (!queue.empty()) {
			u = queue.first(); queue.removeFirst();
			for (e = fg->firstAt(u); e != 0; e=fg->nextAt(u,e)) {
				v = fg->mate(u,e);
				if (fg->res(u,e) >= scale && pEdge[v] == Null 
				    && v != fg->src()) {
					pEdge[v] = e; 
					if (v == fg->snk()) return true;
					queue.addLast(v);
				}
			}
		}
		scale /= 2;
	}
	return false;
}
