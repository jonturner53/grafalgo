/** @file bimatchF.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, fassert } from '../../common/Errors.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import findSplit from '../misc/findSplit.mjs';
import maxflowD from '../maxflow/maxflowD.mjs';
import flowfloor from '../maxflow/flowfloor.mjs';
import Matching from './Matching.mjs';

/** Compute a maximum matching in a bipartite graph by reducing it to a
 *  max flow problem and applying Dinic's algorithm.
 *  @param g is an undirected bipartite graph
 *  @param subsets is an optional ListPair that defines the bipartite
 *  vertex subsets
 *  @param dmin is an array mapping vertices to degree lower bounds
 *  in a generalized matching; if omitted a bound of 0 is used
 *  @param dmax is an array mapping vertices to degree upper bounds
 *  in a generalized matching; if omitted a bound of 1 is used
 *  @return a triple [match, ts, stats] where match is a Matching
 *  object, in the case of an ordinary matching and a Graph object
 *  in the case of a generalized matcing; ts is a possibly empty trace string
 *  and stats is a statistics object, both from Dinic's algorithm;
 *  if dmin>0, the returned (generalized) matching will satisfy the
 *  specified minimum degree if it is possible to do so
 *  @param trace causes a trace string to be returned when true
 *  @exceptions throws an exception if graph is not bipartite
 */
export default function bimatchF(g, subsets=0, dmin=0, dmax=0, trace=0) {
	// divide vertices into two independent sets
	let steps = 0;
	if (!subsets) { subsets = findSplit(g); steps += g.m; }
	assert(subsets, "bimatchF: graph not bipartite");

	// create flow graph, taking care to maintain edge numbers
	let fg = new Flograph(g.n+2, g.n+g.edgeRange);
	if (dmin) fg.addFloors();
	fg.setSource(g.n+1); fg.setSink(g.n+2);
	for (let e = g.first(); e; e = g.next(e)) {
		steps++;
		let u = (subsets.in1(g.left(e)) ? g.left(e) : g.right(e));
		fg.join(u,g.mate(u,e),e); fg.cap(e,1);
	}
	for (let u = subsets.first1(); u; u = subsets.next1(u)) {
		steps++;
		let e = fg.join(fg.source,u); fg.cap(e, (dmax ? dmax[u] : 1));
		if (dmin) fg.floor(e,dmin[u]);
	}
	for (let u = subsets.first2(); u; u = subsets.next2(u)) {
		steps++;
		let e = fg.join(u,fg.sink);
		fg.cap(e, (dmax ? dmax[u] : 1));
		if (dmin) fg.floor(e,dmin[u]);
	}

	// compute flow(s)
	if (dmin) {
		let [,ts,stats] = flowfloor(fg, trace);
		steps += stats.steps;
	}
	let [ts,stats] = maxflowD(fg, trace);
	steps += stats.steps;

	// construct matching from flow
	let match = (dmax ? new Graph(g.n,g.edgeRange) : new Matching(g));
	if (trace) ts += '['; let first = true;
	for (let e = g.first(); e; e = g.next(e)) {
		steps++;
		if (fg.f(e)) {
			if (first) first = false;
			else if (trace) ts += ' ';
			if (trace) ts += g.e2s(e);
			if (dmax) { // generalized matching
				match.join(g.left(e),g.right(e),e);
			} else {
				match.add(e);
			}
		}
	}
	if (trace) ts += ']\n';
	let size = dmax ? match.m : match.size();
	return [match, ts, { 'size': size, 'phases': stats.phases, 'paths':stats.paths, 'steps': steps}];
}
