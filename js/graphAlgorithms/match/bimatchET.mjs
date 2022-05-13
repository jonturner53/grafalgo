/** @file bimatchET.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../common/Errors.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import findSplit from '../misc/findSplit.mjs';
import maxflowD from '../maxflow/maxflowD.mjs';
import flowfloor from '../maxflow/flowfloor.mjs';

/** Compute a maximum matching in a bipartite graph by reducing it to a
 *  max flow problem and applying Dinic's algorithm.
 *  @param g is an undirected bipartite graph
 *  @param trace causes a trace string to be returned when true
 *  @param d is optional upper bound on vertex degree in a generalized
 *  matching
 *  @param dmin is optional lower bound on the vertex degree
 *  @return a triple [match, ts, stats] where match is a Graph containing
 *  just the matching edges, ts is a possibly empty trace string
 *  and stats is a statistics object, both from Dinic's algorithm;
 *  if dmin>0, the returned (generalized) matching will satisfy the
 *  specified minimum degree if it is possible to do so
 *  @exceptions throws an exception if graph is not bipartite
 */
export default function bimatchET(g, trace=false, d=1, dmin=0) {
	// divide vertices into two independent sets
	let split = findSplit(g);
	assert(split != null, "bimatchET: graph not bipartite");

	// create flow graph, taking care to maintain edge numbers
	let fg = new Flograph(g.n+2, g.n+g.m);
	if (dmin > 0) fg.addFloors();
	fg.setSource(g.n+1); fg.setSink(g.n+2);
	for (let e = g.first(); e != 0; e = g.next(e)) {
		let u = (split.isIn(g.left(e)) ? g.left(e) : g.right(e));
		fg.join(u,g.mate(u,e),e); fg.setCapacity(e,1);
	}
	for (let u = split.firstIn(); u != 0; u = split.nextIn(u)) {
		let e = fg.join(fg.source,u); fg.setCapacity(e,d);
		if (dmin > 0) fg.setFloor(e,dmin);
	}
	for (let u = split.firstOut(); u != 0; u = split.nextOut(u)) {
		let e = fg.join(u,fg.sink); fg.setCapacity(e,d);
		if (dmin > 0) fg.setFloor(e,dmin);
	}

	// compute flow(s)
	if (dmin > 0) flowfloor(fg, trace);
	let [ts,stats] = maxflowD(fg, trace);

	// construct matching from flow
	let match = new Graph(g.n,g.edgeRange);
	if (trace) ts += '[';
	for (let e = g.first(); e != 0; e = g.next(e)) {
		if (fg.f(e) != 0) {
			match.join(g.left(e), g.right(e), e);
			if (trace) ts += g.edge2string(e) + ' ';
		}
	}
	if (trace) ts = ts.slice(0,-1) + ']\n';
	return [match, ts, stats];
}
