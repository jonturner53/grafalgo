/** @file beAugPath.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "beAugPath.h"

namespace grafalgo {

/** Find a minimum bounded edge coloring in a bipartite graph.
 *  The algorithm is based on the augmenting path method.
 *  @param g is a reference to the graph
 *  @param color is an array indexed by an edge number; on return
 *  color[e] is the color assigned to edge e
 */
beAugPath::beAugPath(const Wdigraph& g, int color[]) : beColor(g,color) {
	// emap[u][c] is the edge that is colored c at u
	emap = new edge*[gp->n()+1];
	for (vertex u = 1; u <= gp->n(); u++) {
		emap[u] = new edge[cmax+1];
		for (int c = 1; c <= cmax; c++) emap[u][c] = 0;
	}
	maxColor = bmax;
	while (ugp->m() > 0) {
		vertex u = vbd->findmin();
		edge e = ugp->firstAt(u);
		vertex v = ugp->mate(u,e);

		// first look for color that's available at both ends
		Dlist& au = avail[u]; Dlist& av = avail[v];
		int cu = au.first(); int cv = av.first();
		while (cu != 0 && cv != 0 && cu <= maxColor && cv <= maxColor) {
			     if (cu < cv) cu = au.next(cu);
			else if (cu > cv) cv = av.next(cv);
			else { // cu == cv
				if (cu < gp->length(e)) {
					cu = au.next(cu); cv = av.next(cv);
					continue;
				}
				assign(cu,e); emap[u][cu] = emap[v][cu] = e;
				break;
			}
		}
		if (cu != 0 && cv != 0 && cu <= maxColor && cv <= maxColor)
			continue;

		// attempt to find augmenting path using colors up to maxColor
		// if successful, use it to color e
		// iterate through colors in "diagonal pattern" to
		// keep both as small as possible
		cu = cv = 1;
		while (cu <= maxColor) {
			// try to find an augmenting path
			if (au.member(cu) && av.member(cv) &&
			    ((cu >= gp->length(e) && augPath(e,u,cu,cv)) ||
			     (cv >= gp->length(e) && augPath(e,v,cv,cu)))) {
				break;
			}
			// advance to next cu, cv pair
			if (cu > 1) { cu--; cv++; }
			else	    { cu = cv + 1; cv = 1; }
		}
		if (color[e] != 0) continue;
		// allocate and assign new color
		maxColor++; assign(maxColor,e);
		emap[u][maxColor] = emap[v][maxColor] = e;
	}
	for (vertex u = 1; u <= gp->n(); u++) delete [] emap[u];
	delete emap;
}

/** Check for augmenting path and if successful, use it to color edge
 *  @param g is graph
 *  @param e is edge to be colored
 *  @param u is an endpoint of e
 *  @param cu is an available color at u (but not at v)
 *  @param cv is an available color at v=mate(u,e) (but not at u)
 *  @return true if a path was found (and used)
 */
bool beAugPath::augPath(edge e, vertex u, int cu, int cv) {
	vertex v = gp->mate(u,e);
	// look for bounded alternating (cu,cv) path from v
	edge f = emap[v][cu]; vertex w = gp->mate(v,f); int c = cv;
	while (emap[w][c] != 0) {
		// f is next edge on path to be colored
		// w is the "leading endpoint" of f
		// c is the color to be used for f
		if (c < gp->length(f)) return false;
		edge ff = emap[w][c];	// next edge in the path
		c = (c == cu ? cv : cu);
		w = gp->mate(w,ff);
		f = ff;
	}
	if (c < gp->length(f)) return false;
	// found path, now flip its colors
	f = emap[v][cu]; w = gp->mate(v,f); c = cv;
	while (emap[w][c] != 0) {
		// f is next edge on path to be colored
		// w is the "leading endpoint" of f
		// c is the color to use for f
		edge ff = emap[w][c];	// next edge in the path
		color[f] = c;
		emap[gp->tail(f)][c] = emap[gp->head(f)][c] = f;
		c = (c == cu ? cv : cu);
		w = gp->mate(w,ff);
		f = ff;
	}
	assign(cu,e); emap[u][cu] = emap[v][cu] = e; allocate(cv,v);

	// color f, update avail[w], emap
	allocate(c,w); free(color[f],w); color[f] = c;
	emap[gp->tail(f)][c] = emap[gp->head(f)][c] = f;
	
	return true;
}

} // ends namespace
