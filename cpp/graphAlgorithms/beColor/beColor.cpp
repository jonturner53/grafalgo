/** @file beColor.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "beColor.h"

namespace grafalgo {

/** Constructor for beColor class.
 *  @param g is a reference to the graph
 *  @param edgeColors is an array indexed by edge numbers which is allocated
 *  by the caller; on return edgeColors[e] is the color assigned to edge e
 *  @return the number of colors used
 */
beColor::beColor(const Wdigraph& g, int edgeColors[]) {
	gp = &g;
	color = edgeColors;
	for (edge e = g.first(); e != 0; e = g.next(e)) color[e] = 0;

	bmax = 0;
	for (edge e = g.first(); e != 0; e = g.next(e)) 
		bmax = max(bmax,g.length(e));
	cmax = bmax + g.maxDegree();

	// create list of available colors at each vertex
	avail = new Dlist[g.n()+1];
	for (vertex u = 1; u <= g.n(); u++) {
		avail[u].resize(cmax);
		for (int c = 1; c <= cmax; c++) avail[u].addLast(c);
	}
	maxColor = 0;

	// initialize ugp and vbd
	ugp = new Wdigraph(g.n(), g.M()); ugp->copyFrom(g);
	vbd = new Dheap<int>(g.n()+1);
	// insert vertices into vbd using negated degree, so that
	// findmin identifies vertex of max degree
	for (vertex u = 1; u <= g.n(); u++) vbd->insert(u,-g.degree(u));
}

beColor::~beColor() { delete [] avail; delete ugp; delete vbd; } 

/** Allocate a color at a vertex.
 *  @param c is a color 
 *  @param u is a vertex
 */
void beColor::allocate(int c, vertex u) {
	if (avail[u].member(c)) avail[u].remove(c);
}

/** Return a color to list of available colors at a vertex.
 *  @param c is a color 
 *  @param u is a vertex
 */
void beColor::free(int c, vertex u) {
	if (avail[u].member(c)) return;
	if (c < avail[u].first()) {
		avail[u].addFirst(c);
	} else if (c > avail[u].last()) {
		avail[u].addLast(c);
	} else {
		int cc = avail[u].first();
		while (c > avail[u].next(cc)) cc = avail[u].next(cc);
		avail[u].insert(c,cc);
	}
}
	
/** Verify that the data structure is consistent.
 */
bool beColor::isConsistent() {
	// check that no two adjacent edges have the same color
	bool inuse[gp->M()+1];
	for (int c = 1; c <= gp->M(); c++) inuse[c] = false;
	for (vertex u = 1; u <= gp->n(); u++) {
		for (edge e = gp->firstAt(u); e != 0; e = gp->nextAt(u,e)) {
			if (color[e] == 0) continue;
			if (inuse[color[e]]) {
				cerr << "multiple edges at vertex " << u
				     << " are assigned color " << color[e]
				     << "\n";
				return false;
			}
			inuse[color[e]] = true;
		}
		// clear inuse values
		for (edge e = gp->firstAt(u); e != 0; e = gp->nextAt(u,e)) {
			inuse[color[e]] = false;
		}
	}

	// check that avail lists are sorted
	for (vertex u = 1; u <= gp->n(); u++) {
		for (int c = avail[u].first(); c != 0; c = avail[u].next(c)) {
			if (avail[u].next(c) != 0 && c >= avail[u].next(c)) {
				cerr << "avail[" << u << "] not in order:"
				     << avail[u] << endl;
				return false;
			}
		}
	}
	// verify that edges in ugp are uncolored and that keys of vertices
	// in vbd are correct
	// ...
	return true;
}

} // ends namespace
