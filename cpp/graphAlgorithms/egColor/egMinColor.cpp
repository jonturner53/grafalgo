/** @file egMinColor.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "egMinColor.h"

namespace grafalgo {

/** Find an edge group coloring in a bipartite group graph.
 *  The algorithm used here colors the graph as a series of "layers"
 *  where each layer consists of one edge group from each input vertex.
 *  @param g is a reference to the graph
 *  @param edgeColors is an array indexed by edge numbers which is allocated
 *  by the caller; on return color[e] is the color assigned to edge e
 *  @return the number of colors used
 */
egMinColor::egMinColor(GroupGraph& g, int edgeColors[])
			: egColor(g, edgeColors) {
	// repeatedly peel off layers and color them
	bool done;
	do {
		done = true;
		int outCount[g.n()+1]; // outCount[v]=# of layer edges at v
		for (vertex v = 1; v <= g.n(); v++) outCount[v] = 0;
		for (vertex u = 1; u <= g.n(); u++) {
			// select an uncolored group at u
			// that minimizes layer thickness
			if (firstUgroup(u) == 0) continue;
			int bestGroup = 0; int bestCount = g.n();
			for (int grp = firstUgroup(u); grp != 0;
				 grp = nextUgroup(u,grp)) {
				int maxCount = 0;
				for (edge e = g.firstEdgeInGroup(grp); e != 0;
					  e = g.nextEdgeInGroup(grp,e)) {
					vertex v = g.output(e);
					maxCount = max(maxCount, outCount[v]);
				}
				if (maxCount < bestCount) {
					bestGroup = grp; bestCount = maxCount;
				}
			}
			for (edge e = g.firstEdgeInGroup(bestGroup); e != 0;
				  e = g.nextEdgeInGroup(bestGroup,e))
				outCount[g.output(e)]++;
			done = false;
			colorGroup(bestGroup);
			removeUgroup(bestGroup);
		}
	} while (!done);
}

} // ends namespace
