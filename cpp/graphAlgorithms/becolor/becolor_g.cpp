/** @file becolor_g.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "becolor_g.h"

namespace grafalgo {

/** Find a bounded edge coloring in a bipartite graph.
 *  The algorithm colors edges in decreasing order of their maximum
 *  endpoint degree.
 *  @param g is a reference to the graph
 *  @param color is an array indexed by an edge number; on return
 *  color[e] is the color assigned to edge e
 */
becolor_g::becolor_g(const Graph_wd& g, int color[]) : becolor(g,color) {
	while (ugp->m() > 0) {
		// select edge of max degree in uncolored subgraph
		vertex u = vbd->findmin();
		edge e = ugp->firstAt(u);
		vertex v = ugp->mate(u,e);

		// color it with first available color >= bound
		List_d& au = avail[u]; List_d& av = avail[v];
		int cu = au.first(); int cv = av.first();
		while (cu != 0 && cv != 0) {
			     if (cu < cv) cu = au.next(cu);
			else if (cu > cv) cv = av.next(cv);
		   	else { // cu == cv
				if (cu >= g.length(e)) {
					assign(cu,e); break;
				}
				cu = au.next(cu); cv = av.next(cv);
			}
		}
	}
}

} // ends namespace
