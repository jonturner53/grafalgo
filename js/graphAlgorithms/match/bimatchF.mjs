/** @file bimatchF.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import Matching from './Matching.mjs';
import findSplit from '../misc/findSplit.mjs';
import maxflowD from '../maxflow/maxflowD.mjs';
import flowfloor from '../maxflow/flowfloor.mjs';

/** Compute a maximum matching in a bipartite graph by reducing it to a
 *  max flow problem and applying Dinic's algorithm.
 *  @param g is an undirected bipartite graph
 *  @return a triple [match, ts, stats] where match is a Matching
 *  object, in the case of an ordinary matching; ts is a possibly empty
 *  trace string and stats is a statistics object, both from Dinic's algorithm;
 */
export default function bimatchF(g, trace=0) {
	let steps = 0;

	// create flow graph, taking care to maintain edge numbers
	let fg = new Flograph(g.n+2, g.n+g.edgeRange);
	fg.source = g.n+1; fg.sink = g.n+2;
	for (let e = g.first(); e; e = g.next(e)) {
		steps++;
		let u = (g.isInput(g.left(e)) ? g.left(e) : g.right(e));
		fg.join(u,g.mate(u,e),e); fg.cap(e,1);
	}
	for (let u = g.firstInput(); u; u = g.nextInput(u)) {
		steps++;
		let e = fg.join(fg.source,u); fg.cap(e, 1);
	}
	for (let u = g.firstOutput(); u; u = g.nextOutput(u)) {
		steps++;
		let e = fg.join(u,fg.sink); fg.cap(e, 1);
	}

	// compute flow(s)
	let [ts,stats] = maxflowD(fg, trace);
	steps += stats.steps;

	// construct matching from flow
	let match = new Matching(g);
	if (trace) ts += '\nmatching: ['; let first = true;
	for (let e = g.first(); e; e = g.next(e)) {
		steps++;
		if (fg.f(e)) {
			if (first) first = false;
			else if (trace) ts += ' ';
			if (trace) ts += g.e2s(e,0,1);
			match.add(e);
		}
	}
	if (trace) ts += ']\n';
	return [match, ts, { 'size': match.size, 'phases': stats.phases,
						 'paths':stats.paths, 'steps': steps}];
}
