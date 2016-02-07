/** @file matchb_f.cpp
 * 
 *  @author Jon Turner
 *  @date 2014
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Graph.h"
#include "Graph_f.h"
#include "List_g.h"
#include "ListPair.h"
#include "Util.h"
#include "mflo_d.h"

namespace grafalgo {

extern bool findSplit(const Graph&, ListPair&);

/** Find a maximum size matching in a bipartite graph
 *  by reducing the matching problem to a max flow problem.
 *  @param[in] g is a graph
 *  @param[in,out] matchingEdge[u] is (on return) the matching edge incident
 *  to u or 0 if u is unmatched; if matchingEdge is not all 0 initially,
 *  it is assumed to represent a valid initial matching
 */
void matchb_f(const Graph& g, edge *matchingEdge) {
	// divide vertices into two independent sets
	ListPair split(g.n());
	if (!findSplit(g,split))
		Util::fatal("matchb_f: graph is not bipartite");

	// create flow graph, taking care to maintain edge numbers
	Graph_f fg(g.n()+2, g.M()+g.n(), g.n()+1, g.n()+2);
	for (edge e = g.first(); e != 0; e = g.next(e)) {
		vertex u = (split.isIn(g.left(e)) ? g.left(e) : g.right(e));
		fg.joinWith(u,g.mate(u,e),e); fg.setCapacity(e,1);
		if (e == matchingEdge[u]) fg.setFlow(e,1);
	}
	for (vertex u = split.firstIn(); u != 0; u = split.nextIn(u)) {
		edge e = fg.join(fg.src(),u); fg.setCapacity(e,1);
		if (e == matchingEdge[u]) fg.setFlow(e,1);
	}
	for (vertex u = split.firstOut(); u != 0; u = split.nextOut(u)) {
		edge e = fg.join(u,fg.snk()); 
		fg.setCapacity(e,1);
		if (e == matchingEdge[u]) fg.setFlow(e,1);
	}

	// solve flow problem
	(mflo_d(fg)); // parens added to eliminate ambiguity

	// now construct matching from flow
	for (vertex u = 1; u <= g.n(); u++) matchingEdge[u] = 0;
	for (edge e = g.first(); e != 0; e = g.next(e)) {
		vertex u = (split.isIn(g.left(e)) ? g.left(e) : g.right(e));
		if (fg.f(u,e) != 0)
			matchingEdge[u] = matchingEdge[g.mate(u,e)] = e;
	}
}

} // ends namespace
