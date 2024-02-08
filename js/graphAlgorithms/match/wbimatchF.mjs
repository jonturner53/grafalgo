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
 *  @param io is an optional ListPair that defines the bipartite
 *  vertex subsets (inputs and outputs).
 *  @param dmin is an array mapping vertices to degree lower bounds
 *  in a b-matching; if omitted a bound of 0 is used
 *  @param dmax is an array mapping vertices to degree upper bounds
 *  in a b-matching; if omitted a bound of 1 is used
 *  @param trace causes a trace string to be returned when true
 *  @return a triple [match, ts, stats] where match is a Matching
 *  object, in the case of an ordinary matching and a Graph object
 *  in the case of a b-matcing; ts is a possibly empty trace string
 *  and stats is a statistics object, both from underlying max flow
 *  algorithm; if dmin>0, the returned (b-)matching will satisfy the
 *  specified minimum degree if it is possible to do so
 *  @exceptions throws an exception if graph is not bipartite
 */
export default function wbimatchF(g, io=0, dmin=0, dmax=0, trace=0) {
	let paths = 0; let steps = 0;
	// divide vertices into two independent sets
	if (!io) { io = findSplit(g); steps += g.m; }
	if (!io) return [];

	// create flow graph, taking care to maintain edge numbers
	let fg = new Flograph(g.n+2, g.n+g.edgeRange);
	fg.source = g.n+1; fg.sink = g.n+2;
	for (let e = g.first(); e; e = g.next(e)) {
		let u = (io.in(g.left(e),1) ? g.left(e) : g.right(e));
		fg.join(u,g.mate(u,e),e); fg.cap(e,1);
		fg.cost(e, -g.weight(e)); steps++;
	}
	for (let u = io.first(1); u; u = io.next(u)) {
		let e = fg.join(fg.source,u); fg.cost(e, 0); steps++;
		fg.cap(e, (dmax ? dmax[u] : 1));
        if (dmin) fg.floor(e,dmin[u]);
	}
	for (let u = io.first(2); u; u = io.next(u)) {
		let e = fg.join(u,fg.sink); fg.cost(e, 0); steps++;
		fg.cap(e, (dmax ? dmax[u] : 1));
        if (dmin) fg.floor(e,dmin[u]);
	}

    if (dmin) {
        let [,ts,stats] = flowfloor(fg, trace);
        steps += stats.steps;
    }
	let [ts, stats] = mcflowJEK(fg, 1, trace); // solve least-cost flow problem
	paths += stats.paths; steps += stats.steps;
	// construct matching from flow
	let match = (dmax ? new Graph(g.n,g.edgeRange) : new Matching(g));
	if (trace) ts += '\n['; let first = true;
	for (let e = g.first(); e; e = g.next(e)) {
		steps++;
		if (fg.f(e) != 0) {
			if (first) first = false;
			else if (trace) ts += ' ';
			if (trace) ts += g.e2s(e);
			if (dmax) { // b-matching
				match.join(g.left(e), g.right(e), e);
			} else {
				match.add(e);
			}
		}
	}
	if (trace) ts += ']\n';
	return [match, ts, {'weight': match.weight(),
						'paths': paths, 'steps' : steps}];
}
