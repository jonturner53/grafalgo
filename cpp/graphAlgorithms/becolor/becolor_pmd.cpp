/** @file becolor_pmd.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Graph_wd.h"
#include "List_g.h"
#include "pmatch_egt.h"

namespace grafalgo {

/** Find a bounded edge coloring using priority matching based on
 *  degree in uncolored subgraph.
 *  @param g is a reference to the graph
 *  @param color is an array indexed by edge numbers which is allocated
 *  by the caller; on return color[e] is the color assigned to edge e
 */
void becolor_pmd(Graph_wd& g, int color[]) {
	// initialize priorites
	int prty[g.n()+1];  // priority
	for (vertex u = 1; u <= g.n(); u++) {
		prty[u] = min(g.n(),(g.n()+1)-g.degree(u));
	}

	Graph gc(g.n(),g.M()); List_g<edge> match; 
	int c; int cnt = 0;
	for (c = 1; cnt < g.m(); c++) {
		// construct gc (by adding edges to previous gc)
		for (edge e = g.first(); e != 0; e = g.next(e)) {
			if (g.length(e) == c)
				gc.joinWith(g.tail(e), g.head(e), e);
		}
		// find priority matching in gc that favors vertices with high
		// degree in uncolored subgraph
		pmatch_egt(gc, prty, match);
		// color matching edges, then remove from gc and match
		// also update degrees in uncolored subgraph
		for (index x = match.first(); x != 0; x = match.next(x)) {
			edge e = match.value(x);
			color[e] = c; gc.remove(e); cnt++;
			vertex u = g.left(e); vertex v = g.right(e);
			prty[u] = min(g.n(), prty[u]+1);
			prty[v] = min(g.n(), prty[v]+1);
		}
		match.clear();
	}
}

} // ends namespace
