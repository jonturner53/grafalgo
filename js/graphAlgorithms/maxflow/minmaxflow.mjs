/** @file minmaxflow.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import { assert } from '../../common/Errors.mjs';

/** Compute maximum flow in graph with positive minimum flow requirements.
	@param fg is Flograph with lower bounds, possibly with some initial flow.
	@param algo is a reference to a function that computes ordinary max flows;
	note: does not work with maxflowDST, due to use of dynamic trees 
	@param trace is a flag that enables execution tracing
 */
export default function minmaxflow(g, algo, trace=false) {
	// Create separate flow graph for use in first phase
	// First determine total capacity, number
	// of edges with non-zero floors and the sum of min flows
	let cnt = 0; let totalCap = 0; let totalFloor = 0;
	for (let e = g.first(); e != 0; e = g.next(e)) {
		totalCap += g.cap(g.tail(e),e);
		totalFloor += g.floor(e);
		if (g.floor(e) > 0) cnt++;
	}
	// Next copy edges to new flow graph being careful to maintain same
	// edge numbers. Adjust capacities of edges with non-zero min flows.
	let g1 = new Flograph(g.n+2, g.m+2*cnt+1);
	g1.setSource(g.n+1); g1.setSink(g.n+2);
	for (let e = g.first(); e != 0; e = g.next(e)) {
		g1.join(g.tail(e), g.head(e), e);
		g1.setCapacity(e,g.cap(e) - g.floor(e));
	}
	// Now, add edges from new source and edges to new sink.
	for (let u = 1; u <= g.n; u++) {
		let f = 0;
		for (let e = g.firstIn(u); e != 0; e = g.nextIn(u,e)) f += g.floor(e);
		if (f > 0) g1.setCapacity(g1.join(g1.source, u), f);
		f = 0;
		for (let e = g.firstOut(u); e != 0; e = g.nextOut(u,e)) f += g.floor(e);
		if (f > 0) g1.setCapacity(g1.join(u, g1.sink), f);
	}
	// Finally, add high capacity edge from original sink to original source
	let e = g1.join(g.sink, g.source); g1.setCapacity(e, totalCap);
	g1.setFlow(e, g.sink, g.totalFlow());	// to accommodate initial flow

	// Now, find max flow in g1 and check that floor values are all satisfied
	let [f1, ts1, stats1] = algo(g1, trace); ts += ts1;
	if (g1.totalFlow() < totalFloor) return [-1, ts, stats1];

	// Now transfer initial flows back into g and maximize flow.
	for (let e = g.first(); e != 0; e = g.next(e))
		g.setFlow(e, g1.f(e) + g.floor(e));
	if (trace) ts += '\nfeasible flow\n' + g.toString(0,1);
	let [f2, ts2, stats2] = algo(g, trace);
	for (const k in stats2) stats2[k] += stats1[k];
	return [f2, ts, stats2];
}
