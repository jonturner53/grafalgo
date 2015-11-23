/** @file becolor_rm.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Graph_wd.h"
#include "List_g.h"
#include "matchb_hk.h"
#include "mdmatch_f.h"

namespace grafalgo {

/** Find a bounded edge coloring using the repeated matching method.
 *  @param g is a reference to the graph
 *  @param color is an array indexed by edge numbers which is allocated
 *  by the caller; on return color[e] is the color assigned to edge e
 */
void becolor_rm(Graph_wd& g, int color[]) {
	int bmax = 0;
	for (edge e = g.first(); e != 0; e = g.next(e)) 
		bmax = max(bmax,g.length(e));

	Graph gc(g.n(),g.M()); List_g<edge> match; 
	int c; int cnt = 0;
	for (c = 1; cnt < g.m(); c++) {
		// construct gc (by adding edges to previous gc)
		for (edge e = g.first(); e != 0; e = g.next(e)) {
			if (g.length(e) == c)
				gc.joinWith(g.tail(e), g.head(e), e);
		}
		// find max matching in gc
		matchb_hk(gc, match);
		// color matching edges, then remove from gc and match
		for (index x = match.first(); x != 0; x = match.first()) {
			edge e = match.value(x);
			color[e] = c; gc.remove(e); match.removeFirst(); cnt++;
		}
	}
}

} // ends namespace
