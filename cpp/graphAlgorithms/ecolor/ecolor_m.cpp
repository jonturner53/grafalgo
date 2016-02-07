#include "List_g.h"
#include "Graph.h"
#include "mdmatch.h"

namespace grafalgo {

/** Find a minimum edge coloring in a bipartite graph.
 *  The algorithm used here finds a series of matchings, where each
 *  matching includes an edge incident to every max degree vertex.
 *  @param g1 is a reference to the graph
 *  @param color is an array indexed by edge numbers which is allocated
 *  by the caller; on return color[e] is the color assigned to edge e
 *  each list in the set defines a set of edges of the same color
 *  @return the number of colors used
 */
int ecolor_m(Graph& g1, int color[]) {
	Graph g;
	g.copyFrom(g1);
	edge mEdge[g.n()+1];
	for (vertex u = 1; u <= g.n(); u++) mEdge[u] = 0;

	int c = 0;
	while (g.m() != 0) {
		c++; // color to use next
		mdmatch(g,mEdge);
		for (vertex u = 1; u <= g.n(); u++) {
			edge e = mEdge[u];
			if (e != 0) {
				color[e] = c;
				mEdge[u] = mEdge[g.mate(u,e)] = 0;
				g.remove(e);
			}
		}
	}
	return c;
}

} // ends namespace
