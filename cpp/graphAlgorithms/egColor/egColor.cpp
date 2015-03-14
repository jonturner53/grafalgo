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
 *  @param color is an array indexed by edge numbers which is allocated
 *  by the caller; on return color[e] is the color assigned to edge e
 *  @return the number of colors used
 */
egColor::egColor(GroupGraph& g, int edgeColors[]) {
	gp = &g;
	color = edgeColors;
	for (edge e = g.first(); e != 0; e = g.next(e)) color[e] = 0;

	// create list of available colors at each vertex
	// create and initialize usr[u][c] and nusr[u][c]
	avail = new Dlist[g.n()+1];
	int colorBound = g.maxGroupCountIn() * g.maxDegreeOut();
	colorBound = min(colorBound, g.maxDegreeIn()+g.maxDegreeOut()-1);
	usr = new int*[g.n()+1]; nusr = new int*[g.n()+1];
	for (vertex u = 1; u <= g.n(); u++) {
		avail[u].resize(colorBound);
		usr[u] = new int[colorBound]; nusr[u] = new int[colorBound];
		for (int c = 1; c <= colorBound; c++) {
			avail[u].addLast(c); usr[u][c] = nusr[u][c] = 0;
		}
	}
	maxColor = 0;
}

egColor::~egColor() { delete [] avail; delete [] usr; delete [] nusr; }

/** Color the edges in a group, without recoloring.
 *  @param grp is the group number of the group to be colored
 */
void egColor::colorGroup1(int grp) {
	vertex u = gp->input(gp->firstEdgeInGroup(grp));
	for (edge e = gp->firstEdgeInGroup(grp); e != 0;
		  e = gp->nextEdgeInGroup(grp,e)) {
		vertex v = gp->output(e);
		// look for a viable color already used by grp
		int c = avail[v].first();
		while (c != 0) {
			if (gp->groupNumber(usr[u][c]) == grp) break;
			c = avail[v].next(c);
		}
		if (c != 0) {
			color[e] = c; nusr[u][c]++;
			usr[v][c] = e; nusr[v][c] = 1; avail[v].remove(c);
			continue;
		}
		// settle for any viable color
		c = avail[v].first();
		while (!avail[u].member(c)) c = avail[v].next(c);
		color[e] = c;
		avail[u].remove(c); usr[u][c] = e; nusr[u][c] = 1;
		avail[v].remove(c); usr[v][c] = e; nusr[v][c] = 1;
		maxColor = max(maxColor,c);
	}
}

/** Color the edges in a group, using recoloring, when necessary.
 *  @param grp is the group number of the group to be colored
 */
void egColor::colorGroup2(int grp) {
	vertex u = gp->input(gp->firstEdgeInGroup(grp));
	for (edge e = gp->firstEdgeInGroup(grp); e != 0;
		  e = gp->nextEdgeInGroup(grp,e)) {
		vertex v = gp->output(e);
		// look for a viable color already used by grp
		int c = avail[v].first();
		while (c != 0) {
			if (gp->groupNumber(usr[u][c]) == grp) break;
			c = avail[v].next(c);
		}
		if (c != 0) {
			color[e] = c; nusr[u][c]++;
			usr[v][c] = e; nusr[v][c] = 1; avail[v].remove(c);
			continue;
		}
		// look for any viable color
		c = avail[v].first();
		while (!avail[u].member(c)) c = avail[v].next(c);
		if (c <= maxColor) {
			color[e] = c; 
			avail[u].remove(c); usr[u][c] = e; nusr[u][c] = 1;
			avail[v].remove(c); usr[v][c] = e; nusr[v][c] = 1;
		} else {
			recolor(e);
		}
	}
}

/** Color an edge by finding an augmenting path and recoloring it.
 *  @param e is an uncolored edge; if e there is no augmenting path for e
 *  using the current set of colors, maxColor is incremented and the next
 *  color used for e
 */
void egColor::recolor(edge e) {
assert(isConsistent());
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
assert(isConsistent());
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
			} else if (nusr[w][color[f]] > 1 || nusr[w][c] > 1) {
				return false;
			}
		}
		c = (c == i ? j : i); w = gp->mate(w,ff); f = ff; 
	}
	vertex x = w; // last vertex in path
	edge fx = f;  // last edge on path
	int cx = c;   // color for last edge
	// recolor the intermediate edges
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

	if (nusr[x][color[fx]] == 1) {
		// make the color currently used by last edge available at x
		int ac = avail[x].first();
		if (color[fx] < ac) {
			avail[x].addFirst(color[fx]);
		} else {
			while (ac != 0 && color[fx] > avail[x].next(ac))
				ac = avail[x].next(ac);
			if (ac == 0) avail[x].addLast(color[fx]);
			else avail[x].insert(color[fx],ac);
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
	avail[x].remove(cx); usr[x][cx] = fx; nusr[x][cx]++;

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
