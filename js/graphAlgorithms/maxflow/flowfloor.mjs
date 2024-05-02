/** @file flowfloor.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import maxflowPPf from './maxflowPPf.mjs';
import mcflowJEK from '../mcflow/mcflowJEK.mjs';
import ncrKGT from '../mcflow/ncrKGT.mjs';
import { assert, EnableAssert as ea } from '../../common/Assert.mjs';

/** Compute a feasible flow in a graph with specified flow floors.
 *  @param fg is Flograph with floors.
 *  @param trace is a flag that enables execution tracing
 *  @return a triple [success, ts, stats] where success is a flag,
 *  indicating whether or not the computed flow satisfies all the
 *  floor specifications, ts is a trace string and stats is a
 *  statistics object; if there is no feasible flow for the set of
 *  floors, no flow is returned
 */
export default function flowfloor(g, trace=false) {
	let steps = 0; let ts = '';
	if (trace) ts += g.toString(1);

	// First determine total capacity, number
	// of edges with non-zero floors and the sum of min flows
	let floorCount = 0; let totalFloor = 0;
	for (let e = g.first(); e; e = g.next(e)) {
		steps++;
		totalFloor += g.floor(e);
		if (g.floor(e) > 0) floorCount++;
	}
	// Next copy edges to new flow graph being careful to maintain same
	// edge numbers. Adjust capacities of edges with non-zero min flows.
	// Also, add new source/sink edges.
	let g1 = new Flograph(g.n+2, 3*g.edgeRange+1);
	steps += g1.n + g1.edgeRange;
	g1.source = g.n+1; g1.sink = g.n+2;
	for (let e = g.first(); e; e = g.next(e)) {
		steps++;
		g1.join(g.tail(e), g.head(e), e);
		g1.cap(e,g.cap(e) - g.floor(e));
		if (g.hasCosts) g1.cost(e,g.cost(e));
	}
	// Now, add new source/sink edges and set capacities.
	for (let e = g.first(); e; e = g.next(e)) {
		steps++;
		if (g.floor(e) == 0) continue;
		let se = g.edgeRange+e; let te = 2*g.edgeRange+e;
		g1.join(g1.source, g.head(e), se); g1.cap(se, g.floor(e));
		g1.join(g.tail(e), g1.sink,   te); g1.cap(te, g.floor(e));
		if (g.hasCosts) g1.cost(se, g.cost(e));
	}
	// Finally, add high capacity edge from original sink to original source
	let e = g1.join(g.sink, g.source); g1.cap(e, totalFloor);

	// Now, find max flow in g1
	let stats;
	if (g1.hasCosts) {
		[,stats] = ncrKGT(g1); steps += stats.steps;
		[,stats] = mcflowJEK(g1); steps += stats.steps;
	} else {
		[,stats] = maxflowPPf(g1); steps += stats.steps;
	}

	let success = g1.totalFlow() == totalFloor;
	if (success) { // transfer computed flow back into g
		for (let e = g.first(); e; e = g.next(e)) {
			g.flow(e, g1.f(e) + g.floor(e)); steps++;
		}
	}
	if (trace) {
		ts += 'flow on constructed flow graph\n' + g1.toString(1);
		if (success) ts += 'computed flow for original graph\n' + g.toString(9);
		else ts += '** infeasible flow specs';
	}
	return [success, ts, {'flow': g.flowStats().totalFlow, 'steps': steps}];
}
