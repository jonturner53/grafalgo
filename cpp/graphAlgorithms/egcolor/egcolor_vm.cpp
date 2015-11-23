/** @file egcolor_vm.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "egcolor_vm.h"
#include "matchb_hk.h"

namespace grafalgo {

Graph_g *vmpointer;

bool vmcompare(edge e1, edge e2) {
	return	vmpointer->groupSize(vmpointer->groupNumber(e1)) >
		vmpointer->groupSize(vmpointer->groupNumber(e2));
}

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
 *  @param colorLimit is a bound on the number of colors per group
 *  @param edgeColors is an array indexed by edge numbers which is allocated
 *  by the caller; on return edgeColors[e] is the color assigned to edge e
 *  @return the number of colors used
 */
egcolor_vm::egcolor_vm(Graph_g& g, int colorLimit, int edgeColors[])
			: egcolor_menu(g, edgeColors){
	maxColor = max(gp->maxGroupCountIn(), gp->maxDegreeOut());

	// for each output v
	List_d unmatchedEdges(gp->M());
	for (vertex v = gp->firstOut(); v != 0; v = gp->nextOut(v)) {
		dmatch& dm = *dymatch[v];
		int dv = gp->degree(v);
		if (dm.size() == dv) continue;
		// build sorted list of edges for unmatched groups at v
		// edges belonging to largest groups come first
		int vec[dv]; int i = 0;
		for (edge e = gp->firstAt(v); e != 0; e = gp->nextAt(v,e))
			if (dm.matchEdge(gx[e]) == 0) vec[i++] = e;
		vmpointer = gp; sort(vec, vec+i, vmcompare);
		unmatchedEdges.clear();
		while (i > 0) unmatchedEdges.addFirst(vec[--i]);

		// repeat until all groups at v are matched
		while (dm.size() < dv) {
			// select a group that is unmatched at v
			edge e = unmatchedEdges.first();
			int grp = gp->groupNumber(e);
			vertex u = gp->input(e);

			// select available color with the largest gain for grp
			int best = 0; int bestGain = 0;
			for (int c = avail[u].first(); c != 0 && c <= maxColor;
				 c = avail[u].next(c)) {
				if (dm.matchEdge(c+dv) != 0) continue;
				int cgain = gain(c,grp);
				if (cgain > bestGain) {
					best = c; bestGain = cgain;
				}
			}
			if (bestGain <= 0 || menuSize(grp) >= colorLimit) {
				maxColor++; best = maxColor; resetMenu(grp);
			}
			// add selected color to grp's menu and expand matching
			growMenu(grp, best);

			// remove e from unmatchedEdges and add it back to the
			// end of the list if grp is not yet matched
			unmatchedEdges.removeFirst();
			if (dm.matchEdge(gx[e]) == 0) unmatchedEdges.addLast(e);
		}

	}
	for (vertex v = gp->firstOut(); v != 0; v = gp->nextOut(v)) {
		Graph& mg = *mgraf[v];
		dmatch& dm = *dymatch[v];
		// now color the edges using the matching
		for (edge e = gp->firstAt(v); e != 0; e = gp->nextAt(v,e)) {
			edge ee = dm.matchEdge(gx[e]);
			int c = mg.right(ee) - gp->degree(v);
			color[e] = c;
		}
	}
}

egcolor_vm::~egcolor_vm() { }


} // ends namespace
