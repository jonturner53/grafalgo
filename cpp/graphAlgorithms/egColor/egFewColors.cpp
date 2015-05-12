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
 *  @param k is a limit on the number of colors used by each group
 *  @param edgeColors is an array indexed by edge numbers which is allocated
 *  by the caller; on return color[e] is the color assigned to edge e
 *  @return the number of colors used
 */
egFewColors::egFewColors(GroupGraph& g, int k, int edgeColors[])
		 : egColor(g, edgeColors) {
	// repeatedly select a group and color it with a greedy color
	// selection strategy
	Dheap<int> groups(gp->M());
	for (int grp = 1; grp <= gp->M(); grp++) {
		if (gp->groupSize(grp) > 0)
			groups.insert(grp,-(gp->groupSize(grp)));
	}
	while (!groups.empty()) {
		int grp = groups.deletemin();
		fewColorGroup(grp,k);
	}
}

} // ends namespace
