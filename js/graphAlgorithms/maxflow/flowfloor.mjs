/** @file flowfloor.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import maxflowD from './maxflowD.mjs';
import { assert } from '../../common/Errors.mjs';

/** Compute a feasible flow in a graph with specified flow floors.
 *  @param fg is Flograph with floors.
 *  @param trace is a flag that enables execution tracing
    @return a triple [success, ts, stats] where success is a flag,
 *  indicating whether or not the computed flow satisfies all the
 *  floor specifications, ts is a trace string and stats is a
 *  statistics object; if there is no feasible flow for the set of
 *  floors, the returned flow approximates the specification as
 *  closely as possible
 */
export default function flowfloor(g, trace=false) {
	// First determine total capacity, number
	// of edges with non-zero floors and the sum of min flows
	let floorCount = 0; let totalCap = 0; let totalFloor = 0;
	for (let e = g.first(); e != 0; e = g.next(e)) {
		totalCap += g.cap(g.tail(e),e);
		totalFloor += g.floor(e);
		if (g.floor(e) > 0) floorCount++;
	}
    // Next copy edges to new flow graph being careful to maintain same
    // edge numbers. Adjust capacities of edges with non-zero min flows.
	// Also, add new source/sink edges.
    let g1 = new Flograph(g.n+2, g.m+2*floorCount+1);
    g1.setSource(g.n+1); g1.setSink(g.n+2);
    for (let e = g.first(); e != 0; e = g.next(e)) {
        g1.join(g.tail(e), g.head(e), e);
        g1.setCapacity(e,g.cap(e) - g.floor(e));
	}
	// Now, add new source/sink edges.
    for (let e = g.first(); e != 0; e = g.next(e)) {
		if (g.floor(e) == 0) continue;
		g1.setCapacity(g1.join(g1.source, g1.head(e)), g.floor(e));
		g1.setCapacity(g1.join(g1.tail(e), g1.sink), g.floor(e));
    }
    // Finally, add high capacity edge from original sink to original source
    let e = g1.join(g.sink, g.source); g1.setCapacity(e, totalCap);

	// Now, find max flow in g1 and check that floor values are all satisfied
	let [ts,stats] = maxflowD(g1, trace);

	// Now transfer computed flow back into g
    for (let e = g.first(); e != 0; e = g.next(e))
        g.setFlow(e, g1.f(e) + g.floor(e));
	return [g1.totalFlow() == totalFloor, ts, stats];
}
