/** @file egcolor_menu.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "egcolor_menu.h"
#include "Heap_d.h"

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
egcolor_menu::egcolor_menu(Graph_g& g, int edgeColors[]) : egColor(g, edgeColors) {
	maxColor = max(gp->maxGroupCountIn(), gp->maxDegreeOut());

	// initialize empty menus
	menus = new Djsets_cl*[g.n()+1];
	for (vertex u = 1; u <= g.n(); u++)
		menus[u] = new Djsets_cl(colorBound);
	fc = new int[g.M()+1];
	for (int grp = 1; grp <= g.M(); grp++) fc[grp] = 0;

	// initialize menu graphs and matchings
	mgraf = new Graph*[gp->n()+1];
	gx = new int[gp->M()+1];
	dymatch = new dmatch*[gp->n()+1];
	for (vertex v = gp->firstOut(); v != 0; v = gp->nextOut(v)) {
		int dv = gp->degree(v);
		mgraf[v] = new Graph(dv+colorBound, dv*colorBound);
		int i = 1;
		for (edge e = g.firstAt(v); e != 0; e = gp->nextAt(v,e))
			gx[e] = i++;
		dymatch[v] = new dmatch(*mgraf[v], dv);
	}
}

egcolor_menu::~egcolor_menu() {
	for (vertex u = 1; u <= gp->n(); u++) delete menus[u];
	delete [] menus; delete [] fc;
	for (vertex v = gp->firstOut(); v != 0; v = gp->nextOut(v)) {
		delete mgraf[v]; delete dymatch[v];
	}
	delete [] mgraf; delete [] dymatch; delete [] gx;
}

bool egcolor_menu::inMenu(int grp, int c) const {
	for (int cc = firstColor(grp); cc != 0; cc = nextColor(grp,cc)) {
		if (cc == c) return true;
	}
	return false;
}

/** Determine the number of colors in a group's menu.
 *  @param grp is a group number
 *  @return the number of colors in grp's menu
 */
int egcolor_menu::menuSize(int grp) const {
	int cnt = 0;
	for (int c = firstColor(grp); c != 0; c = nextColor(grp,c)) {
		cnt++;
	}
	return cnt;
}

/** Add a color to a group's menu.
 *  This method only updates the menu, not the associated menu graphs
 *  and matchings.
 *  @param c is a color
 *  @param grp is a group number
 */
void egcolor_menu::addColor(int c, int grp) {
	edge e = gp->firstEdgeInGroup(grp);
	if (e == 0) return;
	if (fc[grp] == 0) {
		fc[grp] = c;
	} else {
		menus[gp->input(e)]->join(c,fc[grp]);
	}
}

/** Remove a color from a group's menu.
 *  This method only updates the menu, not the associated menu graphs
 *  and matchings.
 *  @param c is a color
 *  @param grp is a group number
 */
void egcolor_menu::removeColor(int c, int grp) {
	edge e = gp->firstEdgeInGroup(grp);
	if (e == 0) return;
	vertex u = gp->input(e);
	if (fc[grp] == c) fc[grp] = menus[u]->next(c);
	if (fc[grp] == c) fc[grp] = 0;
	else menus[u]->remove(c);
}

/** Clear all menus.  */
void egcolor_menu::clearMenus() {
	for (vertex u = 1; u <= gp->n(); u++) {
		for (int grp = gp->firstGroup(u); grp != 0;
			 grp = gp->nextGroup(u,grp)) {
			while (fc[grp] != 0) removeColor(fc[grp],grp);
		}
	}
}

/** Compute the deficit of a group.
 *  The deficit is defined as the number of menu graphs in which the
 *  vertex for the group is not yet matched.
 *  @param grp is an edge group
 *  @return the deficit value
 */
int egcolor_menu::deficit(int grp) {
	int cnt = 0;
	for (edge e = gp->firstEdgeInGroup(grp); e != 0;
		  e = gp->nextEdgeInGroup(grp,e)) {
		vertex v = gp->output(e);
		dmatch& dm = *dymatch[v];
		if (dm.matchEdge(gx[e]) == 0) cnt++;
	}
	return cnt;
}

/** Compute the value of a color in a group.
 *  The value is defined as the number of edges in the group for which
 *  the specified color is the only one that is directly usable.
 *  @param c is a color within the specified group's menu
 *  @param grp is an edge group
 *  @return the value of c in grp.
 */
int egcolor_menu::value(int c, int grp) {
	int val = 0;
	for (edge e = gp->firstEdgeInGroup(grp); e != 0;
		  e = gp->nextEdgeInGroup(grp,e)) {
		vertex v = gp->output(e);
		Graph& mg = *mgraf[v];
		dmatch& dm = *dymatch[v];
		edge ge = mg.firstAt(gx[e]);
		if (ge == 0) continue;
		edge ee = dm.matchEdge(gx[e]);
		vertex x = c + gp->degree(v);
		if ((ee == 0 && dm.matchEdge(x) == 0) ||
		    (ee != 0 && x == mg.right(ee))) {
			while (true) {
				vertex y = mg.right(ge);
				if (y != x && dm.matchEdge(y) == 0) break;
				ge = mg.nextAt(gx[e],ge);
				if (ge == 0) { val++; break; }
			}
		}
	}
	return val;
}

/** Compute the gain of a color in a group.
 *  The gain is defined as the number of edges in the group for which
 *  a specified new color could be directly used.
 *  @param c is a color outside the specified group's menu
 *  @param grp is an edge group
 *  @return the gain of c in grp.
 */
int egcolor_menu::gain(int c, int grp) {
	int gane = 0;
	for (edge e = gp->firstEdgeInGroup(grp); e != 0;
		  e = gp->nextEdgeInGroup(grp,e)) {
		vertex v = gp->output(e);
		dmatch& dm = *dymatch[v];
		vertex x = c + gp->degree(v);
		if (dm.matchEdge(gx[e]) == 0 && dm.matchEdge(x) == 0) gane++;
	}
	return gane;
}

/** Add a color to the menu of a group and update all related data structures.
 *  @param grp is a group number
 *  @param c is a color to be added to grp's menu
 *  @return the deficit of grp after c has been added
 */
int egcolor_menu::growMenu(int grp, int c) {
	vertex u = gp->input(gp->firstEdgeInGroup(grp));
	addColor(c, grp); allocate(c, u);
	int cnt = 0;
	for (edge e = gp->firstEdgeInGroup(grp); e != 0;
	     	  e = gp->nextEdgeInGroup(grp,e)) {
		vertex v = gp->output(e); int dv = gp->degree(v);
		Graph& mg = *mgraf[v];
		mg.join(gx[e], c+dv);
		dmatch& dm = *dymatch[v];
		if (dm.size() < dv) {
			dm.maxMatch();
			for (edge ee = gp->firstAt(v); ee != 0; 
				  ee = gp->nextAt(v,ee)) {
				int me = dm.matchEdge(gx[ee]);
				if (me == 0) continue;
				int cc = mg.right(me) - dv;
				if (avail[v].member(cc)) {
					allocate(cc, v);
				}
			}
		}
		if (dm.matchEdge(gx[e]) == 0) cnt++;
	}
	return cnt;
}

/** Remove all colors from the menu of a group and update related
 *  data structures.
 *  @param grp is a group number
 */
void egcolor_menu::resetMenu(int grp) {
	vertex u = gp->input(gp->firstEdgeInGroup(grp));
	int c = firstColor(grp);
	while (c != 0) {
		removeColor(c,grp); free(c, u); c = firstColor(grp);
	}
	for (edge e = gp->firstEdgeInGroup(grp); e != 0;
		  e = gp->nextEdgeInGroup(grp,e)) {
		vertex v = gp->output(e); int dv = gp->degree(v);
		Graph &mg = *mgraf[v]; dmatch& dm = *dymatch[v];
		edge ee = dm.matchEdge(gx[e]);
		if (ee != 0) {
			int c = mg.right(ee) - dv;
			dm.unmatch(ee); free(c, v);
		}
		for (edge ee = mg.firstAt(gx[e]); ee != 0;
			  ee = mg.firstAt(gx[e]))
			mg.remove(ee);
	}
}

/** Remove a color from the menu of a group and update all related data
 *  structures.
 *  @param grp is a group number
 *  @param c is a color to be added to grp's menu
 *  @return the deficit of grp after c has been added
 */
int egcolor_menu::shrinkMenu(int grp, int c) {
	removeColor(c,grp);
	vertex u = gp->input(gp->firstEdgeInGroup(grp));
	free(c, u);

	int cnt = 0;
	for (edge e = gp->firstEdgeInGroup(grp); e != 0;
		  e = gp->nextEdgeInGroup(grp,e)) {
		// iterate through each mgraf in grp's mset
		vertex v = gp->output(e); int dv = gp->degree(v);
		Graph &mg = *mgraf[v]; dmatch& dm = *dymatch[v];
		// find edge (gx,c+dv) in mg and remove from mg and
		// possibly from dm
		for (edge ee = mg.firstAt(gx[e]); ee != 0;
			  ee = mg.nextAt(gx[e],ee)) {
			if (mg.right(ee) == c+dv) {
				if (dm.matchEdge(c+dv) == ee) {
					dm.unmatch(ee); free(c, v);
				}
				mg.remove(ee);
				break;
			}
		}
		dm.maxMatch();
		if (dm.matchEdge(gx[e]) == 0) cnt++;
	}
	return cnt;
}

/** Find and remove the least value color from a group's menu,
 *  updating all data structures.
 *  @param grp is a group number
 *  @return grp's deficit, after the update is complete
 */
int egcolor_menu::swapOut(int grp) {
	// find color of least value in grp's menu
	int c = firstColor(grp);
	if (c == 0) return 0;
	int cval = value(c,grp);
	for (int cc = firstColor(grp); cc != 0; cc = nextColor(grp,cc)) {
		int ccval = value(cc,grp);
		if (ccval < cval) { c = cc; cval = ccval; }
	}
	return shrinkMenu(grp, c);
}

/** Determine if the data structures at an output are consistent.
 *  @return true if they are consistent, else false
 */
bool egcolor_menu::isConsistent(vertex v) const {
	int dv = gp->degree(v);
	dmatch& dm = *dymatch[v];
	if (!dm.isConsistent()) return false;
	for (int c = 1; c <= colorBound; c++) {
		if (dm.matchEdge(c+dv) != 0) {
			if (avail[v].member(c)) return false;
		}
	}
	Graph& mg = *mgraf[v];
	for (edge e = gp->firstAt(v); e != 0; e = gp->nextAt(v,e)) {
		vertex u = gp->right(e);
		int grp = gp->groupNumber(e);
		for (edge ee = mg.firstAt(gx[e]); ee != 0;
			  ee = mg.nextAt(gx[e],ee)) {
			int c = mg.right(ee)-dv;
			if (avail[u].member(c)) return false;
			if (!inMenu(grp, c)) return false;
		}
	}
	return true;
}

} // ends namespace
