/** @file wbimatchF.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../common/Errors.mjs';
import match2string from './match2string.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import findSplit from '../misc/findSplit.mjs';
import mcflowJEK from '../mcflow/mcflowJEK.mjs';

/** Compute a maximum weighted matching in a bipartite graph by reducing
 *  it to a least cost flow problem and applying the least-cost augmenting
 *  path algorithm of Jewell, Edmonds and Karp.
 *  @param g is an undirected weighted bipartite graph
 *  @param trace causes a trace string to be returned when true
 *  @return a triple [match, ts, stats] is an array mapping vertices
 *  to their incident matching edge, or 0, ts is a possibly empty trace string
 *  and stats is a statistics object; both from Dinic's algorithm
 *  @exceptions throws an exception if graph is not bipartite
 */
export default function bimatchD(g, trace=false, subsets=null,
								 dmin=null, dmax=null) {
	// divide vertices into two independent sets
	if (!subsets) subsets = findSplit(g);
	assert(subsets != null, "bimatchD: graph not bipartite");

	let steps = 0;
	// create flow graph, taking care to maintain edge numbers
	let fg = new Flograph(g.n+2, g.n+g.m);
	fg.setSource(g.n+1); fg.setSink(g.n+2);
	for (let e = g.first(); e != 0; e = g.next(e)) {
		let u = (subsets.in1(g.left(e)) ? g.left(e) : g.right(e));
		fg.join(u,g.mate(u,e),e); fg.setCapacity(e,1);
		fg.setCost(e, -g.weight(e)); steps++;
	}
	for (let u = subsets.first1(); u != 0; u = subsets.next1(u)) {
		let e = fg.join(fg.source,u); fg.setCost(e, 0); steps++;
		fg.setCapacity(e, (dmax ? dmax[u] : 1));
        if (dmin) fg.setFloor(e,dmin[u]);
	}
	for (let u = subsets.first2(); u != 0; u = subsets.next2(u)) {
		let e = fg.join(u,fg.sink); fg.setCost(e, 0); steps++;
		fg.setCapacity(e, (dmax ? dmax[u] : 1));
        if (dmin) fg.setFloor(e,dmin[u]);
	}

    if (dmin) {
        let [,ts,stats] = flowfloor(fg, trace);
        steps += stats.steps;
    }
	let [ts, stats] = mcflowJEK(fg, trace, 1); // solve least-cost flow problem
	steps += stats.steps;

	// construct matching from flow
	let match = new Int32Array(g.n+1);
	for (let e = g.first(); e != 0; e = g.next(e)) {
		if (fg.f(e) != 0) match[g.left(e)] = match[g.right(e)] = e;
		steps++;
	}
	return [match, `${ts}matching: ${match2string(g,match)}\n`,
			{'steps' : steps}];
}
