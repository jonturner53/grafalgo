/** @file egRmenu.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "egRmenu.h"
#include "hopcroftKarp.h"

namespace grafalgo {

/** Find an edge group coloring in a bipartite group graph.
 *  The algorithm used here assigns random color menus to each group.
 *  It then colors the edges incident to each output v by constructing
 *  a matching in the graph defined by v's incident groups and the
 *  colors in their menus.
 *  @param g is a reference to the graph
 *  @param edgeColors is an array indexed by edge numbers which is allocated
 *  by the caller; on return edgeColors[e] is the color assigned to edge e
 *  @return the number of colors used
 */
egRmenu::egRmenu(GroupGraph& g, int edgeColors[]) : egMenu(g, edgeColors) {
	// use binary search to find the minimum number of colors
	int lo = max(gp->maxGroupCountIn(), gp->maxDegreeOut());
	int hi = 0;
	int cb = lo;
	while (hi >= lo) {
		if (colorAll(cb)) hi = cb;
		else {
			lo = cb+1;
			cb = (hi == 0 ? 2*cb : (hi+lo)/2);
		}
	}
}

/** Attempt to color all the edges in the graph.
 *  Allocate available colors at random among groups at each input,
 *  then color the edges at each output by constructing a matching
 *  on the output's "menu graph".
 *  @param cb is a bound on the number of colors
 *  @return true if successful, else false
 */
bool egRmenu::colorAll(int cb) {
	for (vertex u = 1; u != gp->n(); u++) menus[u].resize(cb);
	for (int grp = 1; grp <= gp->M(); grp++) fc[grp] = 0;
	allocate(cb);

	Graph mgraf(gp->maxDegreeOut()+cb, 10*gp->maxDegreeOut());
	int ve[gp->maxDegreeOut()+1];    // edge at v in group with local index
	for (vertex v = gp->firstOut(); v != 0; v = gp->nextOut(v)) {
		menuGraf(v,mgraf,ve); // construct mgraf, ve

		// find a max matching in the graph; fail if too small
		Glist<int> match(mgraf.M());
		hopcroftKarp(mgraf, match);
		if (match.length() != gp->degree(v)) return false;

		// use matching to assign colors to edges
		int dv = gp->degree(v);
		for (edge me = match.first(); me != 0; me = match.next(me)) {
			int gx = mgraf.left(me); int c = mgraf.right(me)-dv;
			color[ve[gx]] = c;
		}
	}
	return true;
}

/** Allocate colors to groups.
 *  Colors are assigned randomly, but as evenly as possible at each input.
 *  @param cb is a bound on the number of colors
 */
void egRmenu::allocate(int cb) {
	int colors[cb];
	for (vertex u = gp->firstIn(); u != 0; u = gp->nextIn(u)) {
		Util::genPerm(cb, colors);
		int i = 0;
		int gcu = gp->groupCount(u);
		while (i < cb && i <= 10*gcu) {
			for (int grp = gp->firstGroup(u); grp != 0 && i < cb;
				 grp = gp->nextGroup(u,grp)) {
				addColor(colors[i]+1, grp);
				i++;
			}
		}
	}
}

} // ends namespace
