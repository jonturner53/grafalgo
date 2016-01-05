/** @file ecolor_v.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "List_d.h"
#include "Graph.h"

namespace grafalgo {

/** Find a minimum edge coloring in a bipartite graph.
 *  The algorithm is based on the alternating path method.
 *  @param g is a reference to the graph
 *  @param color is an array indexed by an edge number; on return
 *  color[e] is the color assigned to edge e
 *  @return the number of colors used
 */
int ecolor_v(Graph& g, int color[]) {
	int Delta = g.maxDegree();

	// avail[u] is a list of available colors at u
	// emap[u][c] is the edge that is colored c at u
	List_d *avail = new List_d[g.n()+1];
	edge* emap[g.n()+1];
	for (vertex u = 1; u <= g.n(); u++) {
		avail[u].resize(Delta);
		emap[u] = new edge[Delta+1];
		for (int c = 1; c <= Delta; c++) {
			avail[u].addLast(c); emap[u][c] = 0;
		}
	}

	// color each edge in turn
	for (edge e = g.first(); e != 0; e = g.next(e)) {
		// first look for a color that is available at both endpoints
		vertex u = g.left(e); vertex v = g.right(e);
		int cu = avail[u].first(); int cv = avail[v].first();
		while (cu != 0 && cv != 0 && cu != cv) {
			if (cu < cv) cu = avail[u].next(cu);
			else	     cv = avail[v].next(cv);
		}
		if (cu != 0 && cv != 0) {
			// cu == cv, is available at both
			color[e] = cu;
			avail[u].remove(cu); avail[v].remove(cv);
			emap[u][cu] = e; emap[v][cv] = e;
			continue;
		}
		// follow alternating (cu,cv) path and flip its colors
		// depends on graph being bipartite
		cu = avail[u].first(); cv = avail[v].first();
		vertex w = v; int c = cu; edge f = e;
		while (emap[w][c] != 0) {
			// f is next edge on path to be colored
			// w is the "leading endpoint of f"
			// c is the color to use for f
			edge ff = emap[w][c];	// next edge in the path
			color[f] = c;
			emap[g.left(f)][c] = f; emap[g.right(f)][c] = f;
			c = (c == cu ? cv : cu);
			w = g.mate(w,ff);
			f = ff;
		}
		// color the last edge and update the avail sets at endpoints
		color[f] = c;
		emap[g.left(f)][c] = f; emap[g.right(f)][c] = f;
		avail[u].remove(cu); avail[v].remove(cv);

		// update available colors at last vertex on path
		avail[w].remove(c);
		c = (c == cu ? cv : cu);
		emap[w][c] = 0;
		int ac = avail[w].first();
		if (c < ac) avail[w].addFirst(c);
		else {
			while (ac != 0 && c > avail[w].next(ac))
				ac = avail[w].next(ac);
			if (ac == 0) avail[w].addLast(c);
			else avail[w].insert(c,ac);
		}
	}
	delete [] avail;
	return Delta;
}

} // ends namespace
