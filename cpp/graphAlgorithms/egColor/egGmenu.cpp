/** @file egGmenu.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "egGmenu.h"
#include "hopcroftKarp.h"

namespace grafalgo {

/** Find an edge group coloring in a bipartite group graph.
 *  The algorithm used here is a variant of the menu graph method.
 *  It maintains a separate menu graph for each output, and a maximum
 *  matching for each. It also maintains a "deficit" for each edge group,
 *  which is the number of menu graphs for which the group is unmatched.
 *  It then repeatedly selects the group with the largest deficit and
 *  adjusts its menu to reduce its deficit. 
 *  Once all deficits are zero, it colors the edges based on the matchings
 *  in the menu graphs.
 *  @param g is a reference to the graph
 *  @param edgeColors is an array indexed by edge numbers which is allocated
 *  by the caller; on return edgeColors[e] is the color assigned to edge e
 *  @return the number of colors used
 */
egGmenu::egGmenu(GroupGraph& g, int edgeColors[]) : egMenu(g, edgeColors) {
	// create heap sorted by negative group size
	Dheap<int> groups(gp->M());
	for (int grp = 1; grp <= gp->M(); grp++) {
		if (gp->groupSize(grp) > 0)
			groups.insert(grp,-(gp->groupSize(grp)));
	}
	// repeatedly select next largest group and expand menu until it
	// is matched in all its menu graphs
	maxColor = max(g.maxGroupCountIn(), g.maxDegreeOut());
	while (!groups.empty()) {
		int grp = groups.deletemin();
		vertex u = gp->input(gp->firstEdgeInGroup(grp));
		int k = (maxColor + (gp->groupCount(u)-1))/gp->groupCount(u);
		while (true) {
			// select available color with the largest gain for grp
			int best = 0; int bestGain = 0;
			for (int c = avail[u].first(); c != 0 && c <= maxColor;
				 c = avail[u].next(c)) {
				int cgain = gain(c,grp);
				if (cgain > bestGain) {
					best = c; bestGain = cgain;
				}
			}
			if (bestGain <= 0 || menuSize(grp) >= k) {
				maxColor++; best = maxColor; resetMenu(grp);
				k = (maxColor + (gp->groupCount(u)-1))/
				    gp->groupCount(u);
			}
			if (growMenu(grp, best) == 0) break;
		}
	}
	for (vertex v = gp->firstOut(); v != 0; v = gp->nextOut(v)) {
		Graph& mg = *mgraf[v]; dynamicMatch& dm = *dymatch[v];
		// now color the edges using the matching
		for (edge e = gp->firstAt(v); e != 0; e = gp->nextAt(v,e)) {
			color[e] = mg.right(dm.matchEdge(gx[e]))-gp->degree(v);
		}
	}
}

egGmenu::~egGmenu() { }

} // ends namespace
