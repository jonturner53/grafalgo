/** @file egMenu.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "egMenu.h"
#include "Dheap.h"

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
egMenu::egMenu(GroupGraph& g, int edgeColors[]) : egColor(g, edgeColors) {
	menus = new ClistSet[g.n()];
	fc = new int[g.M()];
	for (int grp = 1; grp <= g.M(); grp++) fc[grp] = 0;
}

/** Construct menu graph for a specified output
 *  @param v is vertex for which menu graph is to be constructed
 *  @param mgraf is a suitably-sized Graph data structure in which
 *  the required menu graph is returned; the mgraf inputs are
 *  each identified by a local group index <=degree(v); the mgraf outputs
 *  are identified by the color number plus an offset equal to degree(v)
 *  @param ve is an array used to record the edges in the group graph
 *  that correspond to to the group indexes in the menu graph
 */
void egMenu::menuGraf(vertex v, Graph& mgraf, int *ve) {
	// create bipartite graph from v's input groups to the colors
	// in their menus
	mgraf.clear();
	int gx = 1;	// used to assign local index to groups
			// incident to v
	int dv = gp->degree(v);
	for (edge e = gp->firstAt(v); e != 0; e = gp->nextAt(v,e)) {
		int grp = gp->groupNumber(e);
		ve[gx] = e;	// e is edge at v in group with index gx
		for (int c = firstColor(grp); c != 0; c = nextColor(grp,c))
			mgraf.join(gx,c+dv);
		gx++;
	}
}

} // ends namespace
