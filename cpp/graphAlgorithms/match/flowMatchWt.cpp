/** @file flowMatchWt.cpp
 * 
 *  @author Jon Turner
 *  @date 2014
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Wgraph.h"
#include "Wflograph.h"
#include "Glist.h"
#include "ListPair.h"
#include "Util.h"
#include "mcfLcap.h"

namespace grafalgo {

extern bool findSplit(const Graph&, ListPair&);

/** Find a maximum size matching in a bipartite graph
 *  by reducing the matching problem to a min cost flow problem.
 *  @param g1 is an undirected graph
 *  @param match is a list in which the result is returned
 */
void flowMatchWt(Wgraph& g, Glist<edge>& match) {
	// divide vertices into two independent sets
	ListPair split(g.n());
	if (!findSplit(g,split))
		Util::fatal("flowMatchWt: graph is not bipartite");

	// create flow graph, taking care to maintain edge numbers
	Wflograph fg(g.n()+2, g.M()+g.n(), g.n()+1, g.n()+2);
	for (edge e = g.first(); e != 0; e = g.next(e)) {
		vertex u = (split.isIn(g.left(e)) ? g.left(e) : g.right(e));
		fg.joinWith(u,g.mate(u,e),e);
		fg.setCapacity(e,1); fg.setCost(e,-g.weight(e));
	}
	for (vertex u = split.firstIn(); u != 0; u = split.nextIn(u)) {
		edge e = fg.join(fg.src(),u);
		fg.setCapacity(e,1); fg.setCost(e,0);
	}
	for (vertex u = split.firstOut(); u != 0; u = split.nextOut(u)) {
		edge e = fg.join(u,fg.snk());
		fg.setCapacity(e,1); fg.setCost(e,0);
	}

	// solve flow problem
	mcfLcap(fg,true); // parens added to eliminate ambiguity

	// now construct matching from flow
	match.clear();
	for (edge e = g.first(); e != 0; e = g.next(e)) {
		vertex u = (split.isIn(g.left(e)) ? g.left(e) : g.right(e));
		if (fg.f(u,e) != 0) match.addLast(e);
	}
}

} // ends namespace
