/** @file layers2.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "layers2.h"

namespace grafalgo {

/** Find an edge group coloring in a bipartite group graph.
 *  The algorithm used here colors the graph as a series of "layers"
 *  where each layer consists of one edge group from each input vertex.
 *  @param g is a reference to the graph
 *  @param edgeColors is an array indexed by edge numbers which is allocated
 *  by the caller; on return color[e] is the color assigned to edge e
 *  @return the number of colors used
 */
layers2::layers2(GroupGraph& g, int edgeColors[]) : egColor(g, edgeColors) {
	// repeatedly peel off layers and color them
	vertex nextGroup[g.n()+1];
	for (vertex u = 1; u <= g.n(); u++) nextGroup[u] = g.firstGroup(u);
	while (true) {
		bool done = true;
		for (vertex u = 1; u <= g.n(); u++) {
			int grp = nextGroup[u];
			if (grp == 0) continue;
			done = false;
			colorGroup2(grp);
			nextGroup[u] = g.nextGroup(u,grp);
		}
		if (done) break;
	}
}

} // ends namespace
