/** @file egcolor_l.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "egcolor_l.h"

namespace grafalgo {

/** Constructor for egcolor_l class.
 *  @param g is a reference to the graph
 *  @param edgeColors is an array indexed by edge numbers which is allocated
 *  by the caller; on return edgeColors[e] is the color assigned to edge e
 *  @return the number of colors used
 */
egcolor_l::egcolor_l(Graph_g& g, int edgeColors[]) : egcolor(g,edgeColors) {
	// create and initialize usr[u][c] and nusr[u][c]
	ug = new int[gp->n()+1]; ugrp = new Djsets_cl(gp->M());
	usr = new int*[gp->n()+1]; nusr = new int*[gp->n()+1];
	for (vertex u = 1; u <= gp->n(); u++) {
		usr[u] = new int[colorBound+1]; nusr[u] = new int[colorBound+1];
		for (int c = 1; c <= colorBound; c++) {
			usr[u][c] = nusr[u][c] = 0;
		}
		ug[u] = 0;
		if (gp->isOut(u)) continue;
		for (int grp = gp->firstGroup(u); grp != 0;
			 grp = gp->nextGroup(u,grp)) {
			if (grp == gp->firstGroup(u)) ug[u] = grp;
			else ugrp->join(grp,ug[u]);
		}
	}
	maxColor = 1;
}

egcolor_l::~egcolor_l() {
	for (vertex u = 1; u <= gp->n(); u++) {
		delete [] usr[u]; delete [] nusr[u];
	}
	delete [] usr; delete [] nusr;
}

/** Color the edges in a group, without recoloring.
 *  @param grp is the group number of the group to be colored
 *  @param lo (optional) is the smallest color to use for edges in this group;
 *  (default==0)
 */
void egcolor_l::colorGroup(int grp, int lo) {
	vertex u = gp->input(gp->firstEdgeInGroup(grp));
	for (edge e = gp->firstEdgeInGroup(grp); e != 0;
		  e = gp->nextEdgeInGroup(grp,e)) {
		vertex v = gp->output(e);
		int c = findColor(grp, u, v, lo);
		color[e] = c;
		allocate(c,u); usr[u][c] = e; nusr[u][c]++;
		allocate(c,v); usr[v][c] = e; nusr[v][c] = 1;
		maxColor = max(maxColor,c);
	}
}

/** Find a viable color for an edge in a specified group (without recoloring).
 *  @param grp is a group number
 *  @param u is the input for the group
 *  @param v is the output for a specific edge in the group
 *  @param lo (optional) is a lower bound on the returned color (default=1)
 *  @return a color that can be used to color an edge (u,v);
 *  if there is a viable color already used by grp, return it;
 *  otherwise, return the smallest viable color
 */
int egcolor_l::findColor(int grp, vertex u, vertex v, int lo) {
	// look for viable color already used by grp
	int c = avail[v].first();
	while (c != 0) {
		if (c >= lo && gp->groupNumber(usr[u][c]) == grp) {
			return c;
		}
		c = avail[v].next(c);
	}
	// settle for any viable color
	c = avail[v].first();
	while (c < lo || !avail[u].member(c)) c = avail[v].next(c);
	return c;
}

} // ends namespace
