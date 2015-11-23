/** @file egcolor_r.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "egcolor_r.h"

namespace grafalgo {

/** Find an edge group coloring in a bipartite group graph.
 *  The algorithm used here colors the graph as a series of "layers"
 *  where each layer consists of one edge group from each input vertex.
 *  @param g is a reference to the graph
 *  @param edgeColors is an array indexed by edge numbers which is allocated
 *  by the caller; on return color[e] is the color assigned to edge e
 *  @return the number of colors used
 */
egcolor_r::egcolor_r(Graph_g& g, int edgeColors[]) : egcolor_l(g,edgeColors) {
	// repeatedly peel off layers and color them
	bool done;
	do {
		done = true;
		int outCount[g.n()+1]; // outCount[v]=# of layer edges at v
		for (vertex v = 1; v <= g.n(); v++) outCount[v] = 0;
		for (vertex u = 1; u <= g.n(); u++) {
			// select an uncolored group at u
			// that minimizes layer thickness
			if (firstUgroup(u) == 0) continue;
			int bestGroup = 0; int bestCount = g.n();
			for (int grp = firstUgroup(u); grp != 0;
				 grp = nextUgroup(u,grp)) {
				int maxCount = 0;
				for (edge e = g.firstEdgeInGroup(grp); e != 0;
					  e = g.nextEdgeInGroup(grp,e)) {
					vertex v = g.output(e);
					maxCount = max(maxCount, outCount[v]);
				}
				if (maxCount < bestCount) {
					bestGroup = grp; bestCount = maxCount;
				}
			}
			for (edge e = g.firstEdgeInGroup(bestGroup); e != 0;
				  e = g.nextEdgeInGroup(bestGroup,e))
				outCount[g.output(e)]++;
			done = false;
			recolorGroup(bestGroup);
			removeUgroup(bestGroup);
		}
	} while (!done);
}

/** Color the edges in a group, using recoloring, when necessary.
 *  @param grp is the group number of the group to be colored
 */
void egcolor_r::recolorGroup(int grp) {
	vertex u = gp->input(gp->firstEdgeInGroup(grp));
	for (edge e = gp->firstEdgeInGroup(grp); e != 0;
		  e = gp->nextEdgeInGroup(grp,e)) {
		vertex v = gp->output(e);
		int c = findColor(grp, u, v);
		if (c <= maxColor) {
			color[e] = c; 
			allocate(c,u); usr[u][c] = e; nusr[u][c]++;
			allocate(c,v); usr[v][c] = e; nusr[v][c] = 1;
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
void egcolor_r::recolor(edge e) {
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
	allocate(maxColor,u); allocate(maxColor,v);
	usr[u][maxColor] = usr[v][maxColor] = e;
	nusr[u][maxColor] = nusr[v][maxColor] = 1;
}

/** Look for augmenting path.
 *  @param e is an edge whose output is the first vertex on the path
 *  @param i is a color that is viable at input(e) but not at output(e)
 *  @param j is a color that is viable at output(e) but not at input(e)
 */
bool egcolor_r::foundPath(edge e, int i, int j) {
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
	allocate(j,v); nusr[v][j] = 1; // finish off first path edge
	// color e
	color[e] = i; allocate(i,u);
	usr[u][i] = usr[v][i] = e; nusr[u][i]++;

	// now, deal with last edge
	if (nusr[x][color[fx]] == 1) {
		// make the color currently used by last edge available at x
		// maintain sorted order for avail list
		free(color[fx],x);
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
	allocate(cx,x);
	usr[x][cx] = fx; nusr[x][cx]++;
	usr[gp->mate(x,fx)][cx] = fx;

	return true;
}

} // ends namespace
