/** @file ffScale.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Flograph.h"
#include "ffScale.h"

namespace grafalgo {

/** Find maximum flow in g using the capacity scaling algorithm.
 *  @param g1 is a flow graph
 */
ffScale::ffScale(Flograph& g1) : fordFulkerson(g1) {
	// initialize scale factor to largest power of 2
	// that is <= (max edge capacity)/2
	edge e; int maxCap = 0;
	for (e = g->first(); e != 0; e = g->next(e)) 
		maxCap = max(maxCap,g->cap(g->tail(e),e));
	for (scale = 1; scale <= maxCap/2; scale *= 2) {}   

	main();
}

/** Find a path with sufficient unused residual capacity.
 *  @return true if a path was found from source to sink.
 */
bool ffScale::findPath() {
	vertex u,v; edge e;
	List queue(g->n());

	while (scale > 0) {
		for (u = 1; u <= g->n(); u++) pEdge[u] = 0;
		queue.addLast(g->src());
		while (!queue.empty()) {
			u = queue.first(); queue.removeFirst();
			for (e = g->firstAt(u); e != 0; e=g->nextAt(u,e)) {
				v = g->mate(u,e);
				if (g->res(u,e) >= scale && pEdge[v] == 0 
				    && v != g->src()) {
					pEdge[v] = e; 
					if (v == g->snk()) return true;
					queue.addLast(v);
				}
			}
		}
		scale /= 2;
	}
	return false;
}
 } // ends namespace
