#include "shortPath.h"

/** Find maximum flow using the shortest augment path algorithm.
 *  @param fg1 is a reference to a flow graph
 *  @param floVal is a reference to an integer used to return the
 *  amount of flow added to the flow graph.
 */
shortPath::shortPath(Flograph& fg1, int& floVal) : augPath(fg1,floVal) {
	floVal = 0;
	while(findPath()) {
		floVal += augment(); 
	}
}

/** Find a shortest path with unused residual capacity.
 */
bool shortPath::findPath() {
	vertex u,v; edge e;
	List queue(fg->n());

	for (u = 1; u <= fg->n(); u++) pEdge[u] = 0;
	queue.addLast(fg->src());
	while (!queue.empty()) {
		u = queue.first(); queue.removeFirst();
		for (e = fg->firstAt(u); e != 0; e = fg->nextAt(u,e)) {
			v = fg->mate(u,e);
			if (fg->res(u,e) > 0 && pEdge[v] == 0 && 
			    v != fg->src()) {
				pEdge[v] = e;
				if (v == fg->snk()) {
					return true;
				}
				queue.addLast(v);
			}
		}
	}
	return false;
}
