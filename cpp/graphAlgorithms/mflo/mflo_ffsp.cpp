/** @file mflo_ffsp.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "mflo_ffsp.h"

namespace grafalgo {

/** Find maximum flow using the shortest augment path algorithm.
 *  @param g1 is a reference to a flow graph, possibly with an
 *  initial non-zero flow
 */
mflo_ffsp::mflo_ffsp(Graph_f& g1) : mflo_ff(g1) { main(); }

/** Find a shortest path with unused residual capacity.
 */
bool mflo_ffsp::findPath() {
	vertex u,v; edge e;
	List queue(g->n());

	for (u = 1; u <= g->n(); u++) pEdge[u] = 0;
	queue.addLast(g->src());
	while (!queue.empty()) {
		u = queue.first(); queue.removeFirst();
		for (e = g->firstAt(u); e != 0; e = g->nextAt(u,e)) {
			v = g->mate(u,e);
			if (g->res(u,e) > 0 && pEdge[v] == 0 && 
			    v != g->src()) {
				pEdge[v] = e;
				if (v == g->snk()) {
					return true;
				}
				queue.addLast(v);
			}
		}
	}
	return false;
}

} // ends namespace
