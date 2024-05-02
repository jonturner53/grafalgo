/** @file wbimatchF.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import findSplit from '../misc/findSplit.mjs';
import mcflowJEK from '../mcflow/mcflowJEK.mjs';
import flowfloor from '../maxflow/flowfloor.mjs';
import Matching from './Matching.mjs';

/** Compute a maximum weighted matching in a bipartite graph by reducing
 *  it to a least cost flow problem and applying the least-cost augmenting
 *  path algorithm of Jewell, Edmonds and Karp. Works with positive or
 *  or negative edge weights.
 *  @param g is an undirected weighted bipartite graph
 *  @param trace causes a trace string to be returned when true
 *  @return a triple [match, ts, stats] where match is a Matching
 *  object; ts is a possibly empty trace string and stats is a statistics
 *  object, both from underlying max flow algorithm
 */
export default function wbimatchF(g, trace=0) {
	let paths = 0; let steps = 0;

	// create flow graph, taking care to maintain edge numbers
	let fg = new Flograph(g.n+2, g.n+g.edgeRange);
	fg.source = g.n+1; fg.sink = g.n+2;
	for (let e = g.first(); e; e = g.next(e)) {
		let u = g.isInput(g.left(e)) ? g.left(e) : g.right(e);
		fg.join(u,g.mate(u,e),e); fg.cap(e,1);
		fg.cost(e, -g.weight(e)); steps++;
	}
	for (let u = g.firstInput(); u; u = g.nextInput(u)) {
		let e = fg.join(fg.source,u); fg.cost(e, 0); steps++;
		fg.cap(e, 1);
	}
	for (let u = g.firstOutput(); u; u = g.nextOutput(u)) {
		let e = fg.join(u,fg.sink); fg.cost(e, 0); steps++;
		fg.cap(e, 1);
	}

	let [ts, stats] = mcflowJEK(fg, 1, trace); // solve least-cost flow problem
	paths += stats.paths; steps += stats.steps;
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
	return [match, ts, {'weight': match.weight(),
						'paths': paths, 'steps' : steps}];
}
