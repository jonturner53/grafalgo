/** @file becolor_msm.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Graph_wd.h"
#include "List_g.h"
#include "matchb_hk.h"

namespace grafalgo {

/** Find a bounded edge coloring using the max size matching method.
 *  @param g is a reference to the graph
 *  @param color is an array indexed by edge numbers which is allocated
 *  by the caller; on return color[e] is the color assigned to edge e
 */
void becolor_msm(Graph_wd& g, int color[]) {
	Graph gc(g.n(),g.M());
	edge mEdge[g.n()+1]; for (vertex u = 1; u <= g.n(); u++) mEdge[u] = 0;
	int cnt = 0;
	for (int c = 1; cnt < g.m(); c++) {
		// construct gc (by adding edges to previous gc)
		for (edge e = g.first(); e != 0; e = g.next(e)) {
			if (g.length(e) == c)
				gc.joinWith(g.tail(e), g.head(e), e);
		}
		// find maximum size matching in gc
		matchb_hk(gc, mEdge);

		// color matching edges, then remove from gc and match
		// also update degrees in uncolored subgraph
		for (vertex u = 1; u <= g.n(); u++) {
			edge e = mEdge[u]; if (e == 0) continue;
			vertex v = gc.mate(u,e); if (u > v) continue;
			color[e] = c; gc.remove(e); mEdge[u] = mEdge[v] = 0;
			cnt++;
		}
	}
}

} // ends namespace
