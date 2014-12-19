/** @file capScale.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Flograph.h"
#include "capScale.h"

using namespace grafalgo;

/** Find maximum flow in fg using the capacity scaling algorithm.
 *  @param fg1 is a flow graph
 */
capScale::capScale(Flograph& fg1) : augPath(fg1) {
	// initialize scale factor to largest power of 2
	// that is <= (max edge capacity)/2
	edge e; int maxCap = 0;
	for (e = fg->first(); e != 0; e = fg->next(e)) 
		maxCap = max(maxCap,fg->cap(fg->tail(e),e));
	for (scale = 1; scale <= maxCap/2; scale *= 2) {}   

	main();
}

/** Find a path with sufficient unused residual capacity.
 *  @return true if a path was found from source to sink.
 */
bool capScale::findPath() {
	vertex u,v; edge e;
	List queue(fg->n());

	while (scale > 0) {
		for (u = 1; u <= fg->n(); u++) pEdge[u] = 0;
		queue.addLast(fg->src());
		while (!queue.empty()) {
			u = queue.first(); queue.removeFirst();
			for (e = fg->firstAt(u); e != 0; e=fg->nextAt(u,e)) {
				v = fg->mate(u,e);
				if (fg->res(u,e) >= scale && pEdge[v] == 0 
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
