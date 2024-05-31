/** @file bimatchF.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import flowfloor from '../maxflow/flowfloor.mjs';
import maxflowD from '../maxflow/maxflowD.mjs';
import mcflowJEK from '../mcflow/mcflowJEK.mjs';
import Matching from './Matching.mjs';

/** Compute a maximum size or max weight matching in a bipartite graph
 *  by reducing it to a max flow or min cost flow problem.
 *  @param g is an undirected weighted bipartite graph
 *  @param trace causes a trace string to be returned when true
 *  @return a triple [match, ts, stats] where match is a Matching
 *  object; ts is a possibly empty trace string and stats is a statistics
 *  object, both from underlying max flow algorithm
 */
export default function bimatchF(g, trace=0) {
	let paths = 0; let ts = ''; let steps = 0;
	if (trace) ts += g.toString(1)

	// create flow graph, taking care to maintain edge numbers
	let fg = new Flograph(g.n+2, g.n+g.edgeRange);
	fg.source = g.n+1; fg.sink = g.n+2;
	for (let e = g.first(); e; e = g.next(e)) {
		let u = g.isInput(g.left(e)) ? g.left(e) : g.right(e);
		fg.join(u,g.mate(u,e),e); fg.cap(e,1);
		if (g.hasWeights) fg.cost(e, -g.weight(e)); steps++;
	}
	for (let u = g.firstInput(); u; u = g.nextInput(u)) {
		let e = fg.join(fg.source,u); fg.cost(e, 0); steps++;
		fg.cap(e, 1);
	}
	for (let u = g.firstOutput(); u; u = g.nextOutput(u)) {
		let e = fg.join(u,fg.sink); fg.cost(e, 0); steps++;
		fg.cap(e, 1);
	}

	let [,stats] = (g.hasWeights ? mcflowJEK(fg,1) : maxflowD(fg));
	steps += stats.steps;
	// construct matching from flow
	let match = new Matching(g);
	for (let e = g.first(); e; e = g.next(e)) {
		if (fg.f(e)) match.add(e);
		steps++;
	}
	if (trace) ts += '\nmatching: ' + match.toString() + '\n';
	if (g.hasWeights) stats.weight = match.weight();

	return [match, ts, stats];
}
