#include "Dlist.h"
#include "Graph.h"

namespace grafalgo {

/** Check that a purported coloring is valid.
 *  @param graf is a reference to the graph
 *  @param color[e] is the color assigned to edge e
 *  @return true if this is a valid coloring
 */
bool ecCheck(Graph& graf, int color[]) {
	bool status = true;
	// determine the max degree, Delta
	int Delta = 0;
	for (int u = 1; u < graf.n(); u++) {
		int d = 0;
		for (edge e = graf.firstAt(u); e != 0; e = graf.nextAt(u,e))
			d++;
		Delta = max(Delta,d);
	}
	// verify that every edge is assigned a valid color in 1..Delta
	// and that every non-edge in the array has a color 0
	for (edge e = 0; e <= graf.maxEdgeNum(); e++) {
		if (graf.validEdge(e)) {
			if (color[e] < 1 || color[e] > Delta) {
				cerr << "edge " << graf.edge2string(e) 
				     << " has invalid color " << color[e]
				     << endl;
				status = false;
			}
		} else if (color[e] != 0) {
			cerr << "non-edge " << e << " has color "
			     << color[e] << endl;
			status = false;
		}
	}
	// now check that no two edges have the same color
	bool *inuse = new bool[graf.n()];
	for (int c = 1; c <= graf.n(); c++) inuse[c] = false;
	for (vertex u = 1; u <= graf.n(); u++) {
		for (edge e = graf.firstAt(u); e != 0; e = graf.nextAt(u,e)) {
			if (inuse[color[e]]) {
				cerr << "multiple edges at vertex " << u
				     << " are assigned color " << color[e]
				     << "\n";
				status = false;
				break;
			}
			inuse[color[e]] = true;
		}
		// clear inuse bits
		for (edge e = graf.firstAt(u); e != 0; e = graf.nextAt(u,e)) {
			inuse[color[e]] = false;
		}
	}
	return status;
}

} // ends namespace
