
#include "Dlist.h"
#include "Graph.h"
#include "fmaxdMatch.h"

namespace grafalgo {

using namespace grafalgo;

/** Find a minimum edge coloring in a bipartite graph.
 *  The algorithm used here finds a series of matchings, where each
 *  matching includes an edge incident to every max degree vertex.
 *  graf1 is a reference to the graph
 *  @param color is an array indexed by edge numbers which is allocated
 *  by the caller; on return color[e] is the color assigned to edge e
 *  each list in the set defines a set of edges of the same color
 *  @return the number of colors used
 */
int ecFmatch(Graph& graf1, int color[]) {
	Graph graf; graf.copyFrom(graf1);
	Dlist match(graf.maxEdgeNum());

	int c = 0;
	while (graf.m() != 0) {
		c++;	// color to use next
		fmaxdMatch(graf,match);
		while (!match.empty()) {
			color[match.first()] = c;
			graf.remove(match.first());
			match.removeFirst();
		}
	}
	return c;
}

} // ends namespace
