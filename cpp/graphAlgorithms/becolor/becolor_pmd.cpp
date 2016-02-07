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
	// initialize priorites and matching edges
	int prio[g.n()+1]; edge mEdge[g.n()+1];
	for (vertex u = 1; u <= g.n(); u++) {
		prio[u] = min(g.n(),(g.n()+1)-g.degree(u)); mEdge[u] = 0;
	}

	Graph gc(g.n(),g.M());
	int c; int cnt = 0;
	for (c = 1; cnt < g.m(); c++) {
		// construct gc (by adding edges to previous gc)
		for (edge e = g.first(); e != 0; e = g.next(e)) {
			if (g.length(e) == c)
				gc.joinWith(g.tail(e), g.head(e), e);
		}
		// find priority matching in gc that favors vertices with high
		// degree in uncolored subgraph
		pmatch_egt(gc, prio, mEdge);
		// color matching edges, then remove from gc and match
		// also update degrees in uncolored subgraph
		for (vertex u = 1; u <= g.n(); u++) {
			edge e = mEdge[u]; if (e == 0) continue;
			vertex v = gc.mate(u,e); if (u > v) continue;
			color[e] = c; gc.remove(e); mEdge[u] = mEdge[v] = 0; cnt++;
			prio[u] = min(g.n(), prio[u]+1);
			prio[v] = min(g.n(), prio[v]+1);
		}
	}
}

} // ends namespace
