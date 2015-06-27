/** @file egColor.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "egColor.h"

namespace grafalgo {

/** Constructor for egColor class.
 *  @param g is a reference to the graph
 *  @param edgeColors is an array indexed by edge numbers which is allocated
 *  by the caller; on return edgeColors[e] is the color assigned to edge e
 *  @return the number of colors used
 */
egColor::egColor(GroupGraph& g, int edgeColors[]) {
	gp = &g;
	color = edgeColors;
	for (edge e = g.first(); e != 0; e = g.next(e)) color[e] = 0;

	// create list of available colors at each vertex
	// create and initialize usr[u][c] and nusr[u][c]
	// create and initialize partition of uncolored groups by input
	avail = new Dlist[g.n()+1];
	colorBound = g.maxGroupCountIn() * g.maxDegreeOut();
	//colorBound = min(colorBound, g.maxDegreeIn()+g.maxDegreeOut()-1);
	usr = new int*[g.n()+1]; nusr = new int*[g.n()+1];
	ug = new int[g.n()+1];
	ugrp = new ClistSet(g.M());
	for (vertex u = 1; u <= g.n(); u++) {
		avail[u].resize(colorBound);
		usr[u] = new int[colorBound+1]; nusr[u] = new int[colorBound+1];
		for (int c = 1; c <= colorBound; c++) {
			avail[u].addLast(c);
			usr[u][c] = nusr[u][c] = 0;
		}
		ug[u] = 0;
		if (g.isOut(u)) continue;
		for (int grp = g.firstGroup(u); grp != 0;
			 grp = g.nextGroup(u,grp)) {
			if (grp == g.firstGroup(u)) ug[u] = grp;
			else ugrp->join(grp,ug[u]);
		}
	}
	maxColor = 0;
}

egColor::~egColor() {
	delete [] avail;
	for (vertex u = 1; u <= gp->n(); u++) {
		delete [] usr[u]; delete [] nusr[u];
	}
	delete [] usr; delete [] nusr;
	delete ugrp; delete [] ug;
}

/** Color the edges in a group, without recoloring.
 *  @param grp is the group number of the group to be colored
 *  @param lo (optional) is the smallest color to use for edges in this group;
 *  (default==0)
 */
void egColor::colorGroup(int grp, int lo) {
	vertex u = gp->input(gp->firstEdgeInGroup(grp));
	for (edge e = gp->firstEdgeInGroup(grp); e != 0;
		  e = gp->nextEdgeInGroup(grp,e)) {
		vertex v = gp->output(e);
		int c = findColor(grp, u, v, lo);
		color[e] = c;
		avail[u].remove(c); usr[u][c] = e; nusr[u][c]++;
		avail[v].remove(c); usr[v][c] = e; nusr[v][c] = 1;
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
int egColor::findColor(int grp, vertex u, vertex v, int lo) {
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

/** Color the edges in a group, using recoloring, when necessary.
 *  @param grp is the group number of the group to be colored
 */
void egColor::recolorGroup(int grp) {
	vertex u = gp->input(gp->firstEdgeInGroup(grp));
	for (edge e = gp->firstEdgeInGroup(grp); e != 0;
		  e = gp->nextEdgeInGroup(grp,e)) {
		vertex v = gp->output(e);
		int c = findColor(grp, u, v);
		if (c <= maxColor) {
			color[e] = c; 
			avail[u].remove(c); usr[u][c] = e; nusr[u][c]++;
			avail[v].remove(c); usr[v][c] = e; nusr[v][c] = 1;
		} else {
			recolor(e);
		}
	}
}

/** Color the edges in a group, using a greedy color selection method.
 *  @param grp is the group number of the group to be colored;
 *  all edges in grp are assumed to be uncolored initially (color[e]==0)
 *  @param k controls the expansion of the set of available colors;
 *  a new color is added if the group cannot be colored with <= k colors
 *  without expansion.
 */
void egColor::fewColorGroup(int grp, int k) {
	// select colors in greedy fashion
	int gs = gp->groupSize(grp);
	int colored = 0; int numColors = 0;
	vertex u = gp->input(gp->firstEdgeInGroup(grp));
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
	// update avail, usr, nusr
	for (edge e = gp->firstEdgeInGroup(grp); e != 0;
		  e = gp->nextEdgeInGroup(grp,e)) {
		int c = color[e];
		vertex v = gp->output(e);
		avail[u].remove(c); avail[v].remove(c);
		usr[u][c] = usr[v][c] = e;
		nusr[u][c]++; nusr[u][c] = 1;
	}
}

/** Color an edge by finding an augmenting path and recoloring it.
 *  @param e is an uncolored edge; if e there is no augmenting path for e
 *  using the current set of colors, maxColor is incremented and the next
 *  color used for e
 */
void egColor::recolor(edge e) {
	// attempt to recolor using one of the colors in e's edge group
	vertex u = gp->input(e); vertex v = gp->output(e);
	int grp = gp->groupNumber(e);
	for (int i = 1; i <= maxColor; i++) {
		if (gp->groupNumber(usr[u][i]) != grp) continue;
		int j = avail[v].first();
		while (j <= maxColor) {
			if (foundPath(e,i,j)) return;
			j = avail[v].next(j);
		}
	}
	// try all other color pairs
	int i = avail[u].first();
	while (i <= maxColor) {
		int j = avail[v].first();
		while (j <= maxColor) {
			if (foundPath(e,i,j)) return;
			j = avail[v].next(j);
		}
		i = avail[u].next(i);
	}
	// recoloring didn't work, so allocate new color and use it
	maxColor++;
	color[e] = maxColor;
	avail[u].remove(maxColor); avail[v].remove(maxColor);
	usr[u][maxColor] = usr[v][maxColor] = e;
	nusr[u][maxColor] = nusr[v][maxColor] = 1;
}

/** Look for augmenting path.
 *  @param e is an edge whose output is the first vertex on the path
 *  @param i is a color that is viable at input(e) but not at output(e)
 *  @param j is a color that is viable at output(e) but not at input(e)
 */
bool egColor::foundPath(edge e, int i, int j) {
	vertex u = gp->input(e); vertex v = gp->output(e);
	// check for path
	int c = j; edge f = usr[v][i]; vertex w = gp->input(f);
	while (usr[w][c] != 0) {
		// f is current edge at end of path
		// w is "leading endpoint" of f
		// c is color to be used for f, if path is found
		edge ff = usr[w][c];
		if (w == gp->input(f)) {
			if (gp->groupNumber(ff) == gp->groupNumber(f)) {
				break;
			} else if (nusr[w][i] > 1 || nusr[w][j] > 1) {
				return false;
			}
		}
		c = (c == i ? j : i); w = gp->mate(w,ff); f = ff; 
	}
	vertex x = w; // last vertex in path
	edge fx = f;  // last edge on path
	int cx = c;   // color for last edge
	// recolor path, not including last edge
	c = j; f = usr[v][i]; w = gp->input(f);
	while (w != x) {
		edge ff = usr[w][c];
		color[f] = c; usr[w][c] = usr[gp->mate(w,f)][c] = f;
		c = (c == i ? j : i); w = gp->mate(w,ff); f = ff; 
	}
	avail[v].remove(j); nusr[v][j] = 1; // finish off first path edge
	// color e
	color[e] = i; avail[u].remove(i);
	usr[u][i] = usr[v][i] = e; nusr[u][i]++;

	// now, deal with last edge
	if (nusr[x][color[fx]] == 1) {
		// make the color currently used by last edge available at x
		// maintain sorted order for avail list
		if (color[fx] < avail[x].first()) {
			avail[x].addFirst(color[fx]);
		} else if (color[fx] > avail[x].last()) {
			avail[x].addLast(color[fx]);
		} else {
			int ac = avail[x].first();
			while (color[fx] > avail[x].next(ac))
				ac = avail[x].next(ac);
			avail[x].insert(color[fx],ac);
		}
		usr[x][color[fx]] = nusr[x][color[fx]] = 0;
	} else {
		// find another edge using color[fx]
		int grp = gp->groupNumber(fx);
		for (edge h = gp->firstEdgeInGroup(grp); h != 0;
			  h = gp->nextEdgeInGroup(grp, h)) {
			if (h != fx && color[h] == color[fx]) {
				usr[x][color[fx]] = h; nusr[x][color[fx]]--;
				break;
			}
		}
	}
	color[fx] = cx;
	avail[x].remove(cx);
	usr[x][cx] = fx; nusr[x][cx]++;
	usr[gp->mate(x,fx)][cx] = fx;

	return true;
}

bool egColor::isConsistent() {
	// check that no two adjacent edges have the same color
	// unless they're in the same group
	int inuse[gp->M()];
	for (int c = 1; c <= gp->n(); c++) inuse[c] = 0;
	for (vertex u = 1; u <= gp->n(); u++) {
		for (edge e = gp->firstAt(u); e != 0; e = gp->nextAt(u,e)) {
			if (color[e] == 0) continue;
			if (inuse[color[e]] != 0 &&
			    inuse[color[e]] != gp->groupNumber(e)) {
				cerr << "multiple groups at vertex " << u
				     << " are assigned color " << color[e]
				     << "\n";
				return false;
			}
			inuse[color[e]] = gp->groupNumber(e);
		}
		// clear inuse values
		for (edge e = gp->firstAt(u); e != 0; e = gp->nextAt(u,e)) {
			inuse[color[e]] = 0;
		}
	}

	for (vertex u = 1; u <= gp->n(); u++) {
		for (int c = 1; c <= colorBound; c++) {
			edge e = usr[u][c];
			if (e == 0) {
				if (nusr[u][c] != 0) {
					cerr << "usr[" << u << "][" << c << "]="
					     << usr[u][c] << " and nusr[" << u
					     << "][" << c << "]=" << nusr[u][c]
					     << endl;
					return false;
				}
			} else {
				if (nusr[u][c] == 0) {
					cerr << "usr[" << u << "][" << c << "]="
					     << usr[u][c] << " and nusr[" << u
					     << "][" << c << "]=" << nusr[u][c]
					     << endl;
					return false;
				}
				if (color[e] != c) {
					cerr << "usr[" << u << "][" << c << "]="
					     << usr[u][c] << " and color[" << e
					     << "]=" << color[e] << endl;
					return false;
				}
			}
		}
		int count[colorBound+1];
		for (int c = 0; c <= gp->M(); c++) count[c] = 0;
		for (edge e = gp->firstAt(u); e != 0; e = gp->nextAt(u,e))
			count[color[e]]++;
		for (edge e = gp->firstAt(u); e != 0; e = gp->nextAt(u,e)) {
			int c = color[e];
			if (c != 0 && nusr[u][c] != count[c]) {
				cerr << "nusr[" << u << "][" << c << "]="
				     << nusr[u][c] << " but " << count[c]
				     << " edges have color " << c << endl;
				return false;
			}
		}
		for (int c = avail[u].first(); c != 0; c = avail[u].next(c)) {
			if (avail[u].next(c) != 0 && c >= avail[u].next(c)) {
				cerr << "avail[" << u << "] not in order:"
				     << avail[u] << endl;
				return false;
			}
		}
	}
	return true;
}

} // ends namespace
