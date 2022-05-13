/** @file wbimatchF.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../common/Errors.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import findSplit from '../misc/findSplit.mjs';
import mcflowJEK from '../mcflow/mcflowJEK.mjs';

/** Compute a maximum weighted matching in a bipartite graph by reducing
 *  it to a least cost flow problem and applying the least-cost augmenting
 *  path algorithm of Jewell, Edmonds and Karp.
 *  @param g is an undirected weighted bipartite graph
 *  @param trace causes a trace string to be returned when true
 *  @return a triple [match, ts, stats] where match is a List of
 *  the matching edges, ts is a possibly empty trace string
 *  and stats is a statistics object; both from Dinic's algorithm
 *  @exceptions throws an exception if graph is not bipartite
 */
export default function bimatchD(g, trace=false) {
	// divide vertices into two independent sets
	let split = findSplit(g);
	assert(split != null, "bimatchD: graph not bipartite");

	// create flow graph, taking care to maintain edge numbers
	let fg = new Flograph(g.n+2, g.n+g.m);
	fg.setSource(g.n+1); fg.setSink(g.n+2);
	for (let e = g.first(); e != 0; e = g.next(e)) {
		let u = (split.isIn(g.left(e)) ? g.left(e) : g.right(e));
		fg.join(u,g.mate(u,e),e); fg.setCapacity(e,1);
		fg.setCost(e, -g.weight(e));
	}
	for (let u = split.firstIn(); u != 0; u = split.nextIn(u)) {
		let e = fg.join(fg.source,u); fg.setCapacity(e,1); fg.setCost(e, 0);
	}
	for (let u = split.firstOut(); u != 0; u = split.nextOut(u)) {
		let e = fg.join(u,fg.sink); fg.setCapacity(e,1); fg.setCost(e, 0);
	}

	let [ts, stats] = mcflowJEK(fg, trace, 1); // solve least-cost flow problem

	// construct matching from flow
	let match = new List(g.m);
	for (let e = g.first(); e != 0; e = g.next(e))
		if (fg.f(e) != 0) match.enq(e);
	return [match, `${ts}${match.toString(e=>g.edge2string(e))}\n`, stats];
}
