/** @file beRepMatch.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Wdigraph.h"
#include "Glist.h"
#include "vsetMatch.h"

namespace grafalgo {

/** Find a bounded edge coloring using the max degree matching method.
 *  @param g is a reference to the graph
 *  @param color is an array indexed by edge numbers which is allocated
 *  by the caller; on return color[e] is the color assigned to edge e
 */
void beMaxDegMatch(Wdigraph& g, int color[]) {
	// record degrees in g
	int d[g.n()+1]; int maxd = 0;
	for (vertex u = 1; u <= g.n(); u++) {
		d[u] = g.degree(u); maxd = max(maxd, d[u]);
	}
	// form set of max degree vertices
	Dlist vset(g.n());
	for (vertex u = 1; u <= g.n(); u++) {
		if (d[u] == maxd) vset.addLast(u);
	}

	Graph gc(g.n(),g.M()); Glist<edge> match; 
	int c; int cnt = 0;
	for (c = 1; cnt < g.m(); c++) {
		// construct gc (by adding edges to previous gc)
		for (edge e = g.first(); e != 0; e = g.next(e)) {
			if (g.length(e) == c)
				gc.joinWith(g.tail(e), g.head(e), e);
		}
		// find matching in gc that favors vertices with max
		// degree in uncolored subgraph
		vsetMatch(gc, vset, match);

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
		vset.clear(); 
		for (vertex u = 1; u <= g.n(); u++) {
			if (d[u] == maxd) vset.addLast(u);
		}
	}
}

} // ends namespace
