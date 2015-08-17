/** @file egFewColors.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "egFewColors.h"
#include "Dheap.h"

namespace grafalgo {

/** Find an edge group coloring in a bipartite group graph.
 *  The algorithm used here colors the groups in decreasing order
 *  of size, using a greedy set covering algorithm to limit the
 *  number of colors per group.
 *  @param g is a reference to the graph
 *  @param edgeColors is an array indexed by edge numbers which is allocated
 *  by the caller; on return color[e] is the color assigned to edge e
 *  @return the number of colors used
 */
egFewColors::egFewColors(GroupGraph& g, int edgeColors[])
		 : egColor(g, edgeColors) {
	// repeatedly select a group and color it with a greedy color
	// selection strategy
	Dheap<int> groups(gp->M());
	for (int grp = 1; grp <= gp->M(); grp++) {
		if (gp->groupSize(grp) > 0)
			groups.insert(grp,-(gp->groupSize(grp)));
	}
	maxColor = max(g.maxGroupCountIn(), g.maxDegreeOut());
	while (!groups.empty()) {
		int grp = groups.deletemin();
		fewColorGroup(grp);
	}
}

/** Color the edges in a group, using a greedy color selection method.
 *  @param grp is the group number of the group to be colored;
 *  all edges in grp are assumed to be uncolored initially (color[e]==0)
 */
void egFewColors::fewColorGroup(int grp) {
	// select colors in greedy fashion
	int gs = gp->groupSize(grp);
	int colored = 0; int numColors = 0;
	vertex u = gp->input(gp->firstEdgeInGroup(grp));
	int k = (maxColor + (gp->groupCount(u)-1))/gp->groupCount(u);
	while (colored < gs) {
		// find color that works for most remaining edges
		int bestColor = 0; int bestCount = 0;
		for (int c = 1; c <= maxColor; c++) {
			if (!avail[u].member(c)) continue;
			// count uncolored edges that can use c
			int count = 0;
			for (edge e = gp->firstEdgeInGroup(grp); e != 0;
				  e = gp->nextEdgeInGroup(grp,e)) {
				if (color[e] == 0 &&
				    avail[gp->output(e)].member(c))
					count++;
			}
			// record the color with the most edges
			if (count > bestCount) {
				bestCount = count; bestColor = c;
			}
			if (colored + bestCount == gs) break;
		}
		// quit early if no useful color in current set
		if (bestColor == 0 || 
		    (numColors == k-1 && colored + bestCount < gs))
			break;
		// color the edges with bestColor
		for (edge e = gp->firstEdgeInGroup(grp); e != 0;
			  e = gp->nextEdgeInGroup(grp,e)) {
			if (color[e] == 0 &&
			    avail[gp->output(e)].member(bestColor)) {
				color[e] = bestColor; colored++;
			}
		}
		numColors++;
	}
	if (colored < gs) {
		// loop terminated early, allocate and use new color
		maxColor++;
		for (edge e = gp->firstEdgeInGroup(grp); e != 0;
			  e = gp->nextEdgeInGroup(grp,e)) {
			color[e] = maxColor;
		}
	}
	for (edge e = gp->firstEdgeInGroup(grp); e != 0;
		  e = gp->nextEdgeInGroup(grp,e)) {
		int c = color[e];
		vertex v = gp->output(e);
		allocate(c,u); allocate(c,v);
	}
}

} // ends namespace
