/** @file egcolor_rm.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "egcolor_rm.h"
#include "matchb_hk.h"

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
egcolor_rm::egcolor_rm(Graph_g& g, int edgeColors[]) : egcolor_menu(g, edgeColors) {
	// use binary search to find the minimum number of colors
	int cb = max(gp->maxGroupCountIn(), gp->maxDegreeOut());
	while (cb <= colorBound) {
		for (int i = 0; i < 10; i++)
			if (colorAll(cb)) return;
		cb++;
	}
}

/** Attempt to color all the edges in the graph.
 *  Allocate available colors at random among groups at each input,
 *  then color the edges at each output by constructing a matching
 *  on the output's "menu graph".
 *  @param cb is a bound on the number of colors
 *  @return true if successful, else false
 */
bool egcolor_rm::colorAll(int cb) {
	clearMenus(); assignMenus(cb);
	for (vertex v = gp->firstOut(); v != 0; v = gp->nextOut(v)) {
		Graph& mg = *mgraf[v]; dmatch& dm = *dymatch[v];
		int dv = gp->degree(v);
		mg.clear(); buildMgraf(v); dm.reset();

		if (dm.size() != dv) return false;

		// use matching to assign colors to edges
		for (edge e = gp->firstAt(v); e != 0; e = gp->nextAt(v,e)) {
			color[e] = mg.right(dm.matchEdge(gx[e])) - dv;
		}
	}
	return true;
}

/** Allocate colors to groups.
 *  Colors are assigned randomly, but as evenly as possible at each input.
 *  @param cb is a bound on the number of colors
 */
void egcolor_rm::assignMenus(int cb) {
	int colors[cb];
	for (vertex u = gp->firstIn(); u != 0; u = gp->nextIn(u)) {
		gp->sortGroups(u);
		Util::genPerm(cb, colors);
		int grp = gp->firstGroup(u);
		if (grp == 0) continue;
		for (int i = 0; i < cb; i++) {
			addColor(colors[i]+1, grp);
			grp = gp->nextGroup(u,grp);
			if (grp == 0) grp = gp->firstGroup(u);
		}
	}
}

/** Construct menu graph for a specified output
 *  @param v is vertex for which menu graph is to be constructed
 */
void egcolor_rm::buildMgraf(vertex v) {
	Graph& mg = *mgraf[v];
	int dv = gp->degree(v);
	for (edge e = gp->firstAt(v); e != 0; e = gp->nextAt(v,e)) {
		int grp = gp->groupNumber(e);
		for (int c = firstColor(grp); c != 0; c = nextColor(grp,c)) {
			mg.join(gx[e],c+dv);
		}
	}
}

} // ends namespace
