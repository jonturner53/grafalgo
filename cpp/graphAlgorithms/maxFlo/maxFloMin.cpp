/** @file maxFloMin.cpp
 * 
 *  @author Jon Turner
 *  @date 2013
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Mflograph.h"
#include "dinic.h"
#include "ppFifo.h"

namespace grafalgo {

/** Find maximum flow in flow graph with min flow requirements.
 *  @param g is the flow graph
 *  @param floAlgo specifies which max flow algorithm to use internally;
 *  allowed values are "dinic" and "ppFifo".
 *  @param return true if the min flow requirements could be satisified, else 0
 */
bool maxFloMin(Mflograph& g, string floAlgo) {
	// Create separate flow graph for use in first phase
	// First determine max edge number, total capacity, number
	// of edges with non-zero minimum flows and the sum of min flows
	int cnt = 0; int totalCap = 0; int totalMinFlo = 0;
	for (edge e = g.first(); e != 0; e = g.next(e)) {
		totalCap += g.cap(g.tail(e),e);
		totalMinFlo += g.minFlo(e);
		if (g.minFlo(e) > 0) cnt++;
	}
	// Next copy edges to new flow graph being careful to maintain
	// same edge numbers. Skip edges with non-zero min flows.
	Flograph g2(g.n()+2, g.M()+cnt+1, g.n()+1, g.n()+2);
	for (edge e = g.first(); e != 0; e = g.next(e)) {
		if (g.minFlo(e) > 0) continue;
		vertex u = g.tail(e); vertex v = g.head(e);
		g2.joinWith(u,v,e); g2.setCapacity(e,g.cap(u,e));
	}
	// Now, add edges from new source and edges to new sink.
	for (edge e = g.first(); e != 0; e = g.next(e)) {
		if (g.minFlo(e) <= 0) continue;
		vertex v = g.head(e);
		g2.joinWith(g2.src(),v,e); g2.setCapacity(e,g.minFlo(e));
	}
	for (edge e = g.first(); e != 0; e = g.next(e)) {
		if (g.minFlo(e) <= 0) continue;
		vertex u = g.tail(e);
		edge ee = g2.join(u,g2.snk());
		g2.setCapacity(ee,g.minFlo(e));
	}
	// Finally, add high capacity edge from original sink to original source
	edge e = g2.join(g.snk(), g.src());
	g2.setCapacity(e, totalCap);

	// Now, find max flow in g2 and check that min flow requirements
	// are all satisfied
	if (floAlgo == "dinic") (dinic(g2)); // parens to resolve ambiguity
	else ppFifo(g2, true);
	if (g2.totalFlow() < totalMinFlo) return false;

	// Now, copy flow from g2 into g.
	for (edge e = g.first(); e != 0; e = g.next(e)) {
		vertex u = g.tail(e);
		flow fe = (g.minFlo(e) == 0 ? g2.f(u,e) : g.minFlo(e));
		g.setFlow(e,fe);
	}

	// Now, add convert to a max flow, relying on Mflograph's res()
	// function to ensure we do not remove too much flow from min flow edges
	if (floAlgo == "dinic") (dinic(g)); // parens added to resolve ambiguity
	else ppFifo(g, true);

	return true;
}


} // ends namespace
