/** @file shortPath.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "shortPath.h"

/** Find maximum flow using the shortest augment path algorithm.
 *  @param fg1 is a reference to a flow graph
 *  @param floVal is a reference to an integer used to return the
 *  amount of flow added to the flow graph.
 */
shortPath::shortPath(Flograph& fg1, int& floVal) : augPath(fg1,floVal) {
	floVal = main();
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
