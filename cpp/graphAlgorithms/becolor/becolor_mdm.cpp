/** @file becolor_mdm.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Graph_wd.h"
#include "List_g.h"
#include "pmatchb_hkt.h"

namespace grafalgo {

/** Find a bounded edge coloring using the max degree matching method.
 *  @param g is a reference to the graph
 *  @param color is an array indexed by edge numbers which is allocated
 *  by the caller; on return color[e] is the color assigned to edge e
 */
void becolor_mdm(Graph_wd& g, int color[]) {
	// record degrees in g
	int d[g.n()+1]; int maxd = 0;
	for (vertex u = 1; u <= g.n(); u++) {
		d[u] = g.degree(u); maxd = max(maxd, d[u]);
	}
	// assign priorities
	int priority[g.n()+1];
	for (vertex u = 1; u <= g.n(); u++)
		priority[u] = (d[u] == maxd ? 1 : 2);

	Graph gc(g.n(),g.M()); List_g<edge> match; 
	int c; int cnt = 0;
	for (c = 1; cnt < g.m(); c++) {
		// construct gc (by adding edges to previous gc)
		for (edge e = g.first(); e != 0; e = g.next(e)) {
			if (g.length(e) == c)
				gc.joinWith(g.tail(e), g.head(e), e);
		}
		// find matching in gc that favors vertices with max
		// degree in uncolored subgraph
		pmatchb_hkt(gc, priority, match);

		// color matching edges, then remove from gc and match
		// also update degrees in uncolored subgraph
		for (index x = match.first(); x != 0; x = match.first()) {
			edge e = match.value(x);
			color[e] = c; gc.remove(e); match.removeFirst(); cnt++;
			d[g.left(e)]--; d[g.right(e)]--;
		}
		// recompute max degree vertices
		maxd = 0;
		for (vertex u = 1; u <= g.n(); u++) maxd = max(maxd, d[u]);
		for (vertex u = 1; u <= g.n(); u++) 
			priority[u] = (d[u] == maxd ? 1 : 2);
	}
}

} // ends namespace
