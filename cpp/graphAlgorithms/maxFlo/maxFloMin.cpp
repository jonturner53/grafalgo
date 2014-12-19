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
#include "shortPath.h"

using namespace grafalgo;

/** Find maximum flow in flow graph with min flow requirements.
 *  @param fg is the flow graph
 *  @param floAlgo specifies which max flow algorithm to use internally;
 *  allowed values are "dinic" and "ppFifo".
 *  @param return true if the min flow requirements could be satisified, else 0
 */
bool maxFloMin(Mflograph& fg, string floAlgo) {
	// Create separate flow graph for use in first phase
	// First determine max edge number, total capacity, number
	// of edges with non-zero minimum flows and the sum of min flows
	int cnt = 0; edge maxEdge = 0; int totalCap = 0; int totalMinFlo = 0;
	for (edge e = fg.first(); e != 0; e = fg.next(e)) {
		maxEdge = max(maxEdge,e);
		totalCap += fg.cap(fg.tail(e),e);
		totalMinFlo += fg.minFlo(e);
		if (fg.minFlo(e) > 0) cnt++;
	}
	// Next copy edges to new flow graph being careful to maintain
	// same edge numbers. Skip edges with non-zero min flows.
	Flograph fg2(fg.n()+2, maxEdge+cnt+1, fg.n()+1, fg.n()+2);
	for (edge e = fg.first(); e != 0; e = fg.next(e)) {
		if (fg.minFlo(e) > 0) continue;
		vertex u = fg.tail(e); vertex v = fg.head(e);
		fg2.joinWith(u,v,e); fg2.setCapacity(e,fg.cap(u,e));
	}
	// Now, add edges from new source and edges to new sink.
	for (edge e = fg.first(); e != 0; e = fg.next(e)) {
		if (fg.minFlo(e) <= 0) continue;
		vertex v = fg.head(e);
		fg2.joinWith(fg2.src(),v,e); fg2.setCapacity(e,fg.minFlo(e));
	}
	for (edge e = fg.first(); e != 0; e = fg.next(e)) {
		if (fg.minFlo(e) <= 0) continue;
		vertex u = fg.tail(e);
		edge ee = fg2.join(u,fg2.snk());
		fg2.setCapacity(ee,fg.minFlo(e));
	}
	// Finally, add high capacity edge from original sink to original source
	edge e = fg2.join(fg.snk(), fg.src());
	fg2.setCapacity(e, totalCap);

	// Now, find max flow in fg2 and check that min flow requirements
	// are all satisfied
	if (floAlgo == "dinic") (dinic(fg2)); // parens added to resolve ambiguity
	else ppFifo(fg2, true);
	if (fg2.totalFlow() < totalMinFlo) return false;

	// Now, copy flow from fg2 into fg.
	for (edge e = fg.first(); e != 0; e = fg.next(e)) {
		vertex u = fg.tail(e);
		flow fe = (fg.minFlo(e) == 0 ? fg2.f(u,e) : fg.minFlo(e));
		fg.setFlow(e,fe);
	}

	// Now, add convert to a max flow, relying on Mflograph's res()
	// function to ensure we do not remove too much flow from min flow edges
	if (floAlgo == "dinic") (dinic(fg)); // parens added to resolve ambiguity
	else ppFifo(fg, true);

	return true;
}

