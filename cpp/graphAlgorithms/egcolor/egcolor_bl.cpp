/** @file egcolor_bl.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "egcolor_bl.h"

namespace grafalgo {

/** Find an edge group coloring in a bipartite group graph.
 *  The algorithm used here colors the graph as a series of "layers"
 *  where each layer consists of one edge group from each input vertex.
 *  @param g is a reference to the graph
 *  @param edgeColors is an array indexed by edge numbers which is allocated
 *  by the caller; on return color[e] is the color assigned to edge e
 *  @return the number of colors used
 */
egcolor_bl::egcolor_bl(Graph_g& g, int edgeColors[])
				: egcolor_l(g, edgeColors) {
	// repeatedly peel off layers and color them
	vertex nextGroup[gp->n()+1];
	for (vertex u = 1; u <= gp->n(); u++) nextGroup[u] = gp->firstGroup(u);
	maxColor = 0;
	while (true) {
		bool done = true;
		int lo = maxColor+1; // min color to use in this layer
		for (vertex u = 1; u <= gp->n(); u++) {
			int grp = nextGroup[u];
			if (grp == 0) continue;
			done = false;
			colorGroup(grp,lo);
			nextGroup[u] = gp->nextGroup(u,grp);
		}
		if (done) break;
	}
}

} // ends namespace
