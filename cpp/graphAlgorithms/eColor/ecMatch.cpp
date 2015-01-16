#include "Glist.h"
#include "Graph.h"
#include "maxdMatch.h"

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
int ecMatch(Graph& g1, int color[]) {
	Graph g;
	g.copyFrom(g1);
	Glist<edge> match(g.M());

	int c = 0;
	while (g.m() != 0) {
		c++; // color to use next
		maxdMatch(g,match);
		while (!match.empty()) {
			edge e = match.value(match.first());
			match.removeFirst();
			color[e] = c;
			g.remove(e);
		}
	}
	return c;
}

} // ends namespace
