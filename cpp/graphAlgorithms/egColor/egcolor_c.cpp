/** @file egcolor_c.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "egcolor_c.h"
#include "Heap_d.h"

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
egcolor_c::egcolor_c(Graph_g& g, int k, int edgeColors[])
		 : egColor(g, edgeColors) {
	// repeatedly select a group and color it with a greedy color
	// selection strategy

	// egCnt[v] is the number of eligible groups with an uncolored edge
	// incident to output v; if none of v's edges have been selected
	// in the current phase and egCnt[v]==1, then v is critical
	// ucCnt[grp] is the number of outputs incident to uncolored edges
	// in grp that have not yet been covered in the current phase
	// critCnt[grp] is the number of critical vertices incident to
	// an uncolored edge in grp
	Heap_d<int> eligible(g.M());	// ordered by ucCnt
	Heap_d<int> essential(g.M());	// orderd by critCnt
	while (some edges are uncolored) {
		// per phase initialization
		egCnt[v] = # of uncolored edges incident to v
		ucCnt[grp] = # of uncolored edges in grp
		critCnt[grp] = # of edges in grp incident to critical outputs
		while (!eligible.empty()) {
			if (!essential.empty()) {
				grp = essential.deletemin();
				eligible.delete(grp);
			} else {
				grp = eligible.deletemin();
			}
			for (edge e in grp) {
				color[e] = maxColor;
				egCnt[v]--;
			}
			for (group gg at u) {
				if (eligible.member(gg)) eligible.delete(gg);
				if (essential.member(gg)) essential.delete(gg);
			}
		}
		maxColor++;
	}
}

In each phase, attempt to cover each output exactly once.

A group is eligible in the current phase if it has some uncolored
edges and no other group at the same input has been selected yet.

An output is critical if none of its edges has been selected in the
current phase and only one eligible group has an edge incident to it.

An eligible group is essential if it has at lease one edge incident 
to some critical output.

Let E_i be the set of edges selected in phase i.
Repeatedly select a group as follows.
- if there is an essential group, select the essential group that
  has the most uncolored edges incident to critical outputs
- otherwise, select an eligible group that has the most uncolored edges
  incident to outputs not yet covered in this phase
add to E_i the edges from the selected group that are incident to
previously uncovered outputs
At the end of the phase, color all of the edges in E_i with i.

Let L be a heap containing the non-essential eligible groups,
with key equal to the number of uncovered outputs reached by each group.
Let S be a heap containing the essential groups, with key equal
to the number of critical outputs reached by the group.

} // ends namespace
