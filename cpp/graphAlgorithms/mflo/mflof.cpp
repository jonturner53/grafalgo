/** @file mflof.cpp
 * 
 *  @author Jon Turner
 *  @date 2013
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Graph_ff.h"
#include "mflo_d.h"
#include "mflo_ppf.h"

namespace grafalgo {

/** Find maximum flow in flow graph with flow floor values.
 *  @param g is the flow graph
 *  @param floAlgo specifies which max flow algorithm to use internally;
 *  allowed values are "mflo_d" and "mflo_ppf".
 *  @param return true if the floor requirements could be satisified,
 *  else false; in the latter case, the total flow on the edges with
 *  non-zero flow requirements is as large as it can be
 */
bool mflof(Graph_ff& g, string floAlgo) {
	// Create separate flow graph for use in first phase
	// First determine total capacity, number
	// of edges with non-zero floors and the sum of min flows
	int cnt = 0; int totalCap = 0; int totalFloor = 0;
	for (edge e = g.first(); e != 0; e = g.next(e)) {
		totalCap += g.cap(g.tail(e),e);
		totalFloor += g.floor(e);
		if (g.floor(e) > 0) cnt++;
	}
	// Next copy edges to new flow graph being careful to maintain same
	// edge numbers. Adjust capacities of edges with non-zero min flows.
	Graph_f g1(g.n()+2, g.M()+2*cnt+1, g.n()+1, g.n()+2);
	for (edge e = g.first(); e != 0; e = g.next(e)) {
		vertex u = g.tail(e); vertex v = g.head(e); g1.joinWith(u,v,e);
		g1.setCapacity(e,g.cap(u,e) - g.floor(e));
	}
	// Now, add edges from new source and edges to new sink.
	for (edge e = g.first(); e != 0; e = g.next(e)) {
		if (g.floor(e) <= 0) continue;
		vertex u = g.tail(e); vertex v = g.head(e);
		edge ee = g1.join(u,g1.snk()); g1.setCapacity(ee,g.floor(e));
		ee = g1.join(g1.src(),v); g1.setCapacity(ee,g.floor(e));
	}
	// Finally, add high capacity edge from original sink to original source
	edge e = g1.join(g.snk(), g.src());
	g1.setCapacity(e, totalCap);

	// Now, find max flow in g1 and check that min flow requirements
	// are all satisfied
	if (floAlgo == "mflo_d") (mflo_d(g1)); // parens to resolve ambiguity
	else mflo_ppf(g1, true);
	if (g1.totalFlow() < totalFloor) return false;

	// Now transfer initial flows back into g and maximize flow.
	for (edge e = g.first(); e != 0; e = g.next(e)) {
		vertex u = g.tail(e); g.setFlow(e, g1.f(u,e) + g.floor(e));
	}
	if (floAlgo == "mflo_d") (mflo_d(g)); // parens to resolve ambiguity
	else mflo_ppf(g, true);

	return true;
}


} // ends namespace
