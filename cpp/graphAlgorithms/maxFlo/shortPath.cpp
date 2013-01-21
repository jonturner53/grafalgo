/** @file shortPath.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "shortPath.h"

/** Find maximum flow using the shortest augmenting path algorithm.
 *  @param fg1 is a reference to the flograph for which a max flow is
 *  required; on return, the flow fields of the flow graph contain
 *  the max flow
 *  @param floVal is a reference to an integer in which the value of
 *  the resulting flow is returned
 */
shortPath::shortPath(Flograph& fg1, int& floVal) : augPath(fg1,floVal) {
// Find maximum flow in fg using the shortest augment path algorithm.
	floVal = 0;
	while(findPath()) {
		floVal += augment(); 
	}
}

/** Find a shortest augmenting path.
 *  @return true if there is an augmenting path, else false
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
				if (v == fg->snk()) return true;
				queue.addLast(v);
			}
		}
	}
	return false;
}
