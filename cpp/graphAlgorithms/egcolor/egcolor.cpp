/** @file egcolor.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "egcolor.h"

namespace grafalgo {

/** Constructor for egcolor class.
 *  @param g is a reference to the graph
 *  @param edgeColors is an array indexed by edge numbers which is allocated
 *  by the caller; on return edgeColors[e] is the color assigned to edge e
 *  @return the number of colors used
 */
egcolor::egcolor(Graph_g& g, int edgeColors[]) {
	gp = &g;
	color = edgeColors;
	for (edge e = g.first(); e != 0; e = g.next(e)) color[e] = 0;

	colorBound = 10 * max(g.maxGroupCountIn(),g.maxDegreeOut());

	// create list of available colors at each vertex
	avail = new List_d[g.n()+1];
	for (vertex u = 1; u <= g.n(); u++) {
		avail[u].resize(colorBound);
		for (int c = 1; c <= colorBound; c++) {
			avail[u].addLast(c);
		}
	}
	maxColor = 1;
}

egcolor::~egcolor() { delete [] avail; }

/** Allocate a color at a vertex.
 *  @param c is a color 
 *  @param u is a vertex
 */
void egcolor::allocate(int c, vertex u) {
	if (avail[u].member(c)) avail[u].remove(c);
}

/** Return a color to list of available colors at a vertex.
 *  @param c is a color 
 *  @param u is a vertex
 */
void egcolor::free(int c, vertex u) {
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
	
bool egcolor::isConsistent() {
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
	return true;
}

} // ends namespace
