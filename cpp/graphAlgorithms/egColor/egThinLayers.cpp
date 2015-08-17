/** @file egThinLayers.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "egThinLayers.h"

namespace grafalgo {

/** Find an edge group coloring in a bipartite group graph.
 *  The algorithm used extends the basic layering algorithm,
 *  by selecting edge groups that minimize the layer thickness.
 *  @param g is a reference to the graph
 *  @param edgeColors is an array indexed by edge numbers which is allocated
 *  by the caller; on return color[e] is the color assigned to edge e
 *  @return the number of colors used
 */
egThinLayers::egThinLayers(GroupGraph& g, int edgeColors[])
			   : egLayers(g, edgeColors) {
	// repeatedly peel off layers and color them
	bool done; maxColor = 0;
	do {
		done = true;
		int lo = maxColor+1; // min color to use in this layer
		int outCount[gp->n()+1]; // outCount[v]=# of layer edges at v
		for (vertex v = 1; v <= gp->n(); v++) outCount[v] = 0;
		for (vertex u = 1; u <= gp->n(); u++) {
			// select an uncolored group at u
			// that minimizes layer thickness
			if (firstUgroup(u) == 0) continue;
			int bestGroup = 0; int bestCount = gp->n();
			for (int grp = firstUgroup(u); grp != 0;
				 grp = nextUgroup(u,grp)) {
				int maxCount = 0;
				for (edge e = gp->firstEdgeInGroup(grp); e != 0;
					  e = gp->nextEdgeInGroup(grp,e)) {
					vertex v = gp->output(e);
					maxCount = max(maxCount, outCount[v]);
				}
				if (maxCount < bestCount) {
					bestGroup = grp; bestCount = maxCount;
				}
			}
			for (edge e = gp->firstEdgeInGroup(bestGroup); e != 0;
				  e = gp->nextEdgeInGroup(bestGroup,e))
				outCount[gp->output(e)]++;
			done = false;
			colorGroup(bestGroup,lo);
			removeUgroup(bestGroup);
		}
	} while (!done);
}

} // ends namespace
