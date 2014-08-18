#include "Dlist.h"
#include "Graph.h"

namespace grafalgo {

/** Find a minimum edge coloring in a bipartite graph.
 *  The algorithm is based on the alternating path method.
 *  @param graf is a reference to the graph
 *  @param color is an array indexed by an edge number; on return
 *  color[e] is the color assigned to edge e
 *  each list in the set defines a set of edges of the same color
 *  @return the number of colors used
 */
int ecAltPath(Graph& graf, int color[]) {
	// determine the max degree, Delta
	int Delta = 0;
	for (int u = 1; u < graf.n(); u++) {
		int d = 0;
		for (edge e = graf.firstAt(u); e != 0; e = graf.nextAt(u,e))
			d++;
		Delta = max(Delta,d);
	}
	// avail[u] is a list of available colors at u
	// emap[u][c] is the edge that is colored c at u
	Dlist *avail = new Dlist[graf.n()+1];
	edge* emap[graf.n()+1];
	for (vertex u = 1; u <= graf.n(); u++) {
		avail[u].resize(Delta);
		emap[u] = new edge[Delta+1];
		for (int c = 1; c <= Delta; c++) {
			avail[u].addLast(c); emap[u][c] = 0;
		}
	}

	// color each edge in turn
	for (edge e = graf.first(); e != 0; e = graf.next(e)) {
		// first look for a color that is available at both endpoints
		vertex u = graf.left(e); vertex v = graf.right(e);
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
			emap[graf.left(f)][c] = f; emap[graf.right(f)][c] = f;
			c = (c == cu ? cv : cu);
			w = graf.mate(w,ff);
			f = ff;
		}
		// color the last edge and update the avail sets at endpoints
		color[f] = c;
		emap[graf.left(f)][c] = f; emap[graf.right(f)][c] = f;
		avail[u].remove(cu); avail[v].remove(cv); avail[w].remove(c);
	}
	delete [] avail;
	return Delta;
}

} // ends namespace
