/** @file dcsF.mjs
 *
 *  @author Jon Turner
 *  @date 2024
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import maxflowD from '../maxflow/maxflowD.mjs';
import flowfloor from '../maxflow/flowfloor.mjs';

/** Compute a degree-constrained subgraph in a bipartite graph by
 *  solving a max flow problem using Dinic's algorithm.
 *  @param g is an undirected bipartite graph
 *  @param hi is an array mapping vertices to degree upper bounds
 *  @param lo is an optional array mapping vertices to degree lower bounds;
 *  if omitted a bound of 0 is used
 *  @return a triple [dcs, ts, stats] where dcs is a Graph object;
 *  ts is a possibly empty trace string and stats is a statistics object;
 *  if lo>0, the returned dcs will satisfy the
 *  specified minimum degree requirements if it is possible to do so
 *  @param trace causes a trace string to be returned when true
 */
export default function dcsF(g, hi, lo=0, trace=0) {
	let steps = 0;
	let lo0 = lo; if (!lo) lo = new Int32Array(g.n+1);

	// create flow graph, taking care to maintain edge numbers
	let fg = new Flograph(g.n+2, g.n+g.edgeRange); fg.hasFloors = 1;
	fg.source = g.n+1; fg.sink = g.n+2;
	for (let e = g.first(); e; e = g.next(e)) {
		steps++;
		let u = (g.isInput(g.left(e),1) ? g.left(e) : g.right(e));
		fg.join(u,g.mate(u,e),e); fg.cap(e,1);
	}
	for (let u = g.firstInput(); u; u = g.nextInput(u)) {
		steps++;
		let e = fg.join(fg.source,u); fg.cap(e, hi[u]); fg.floor(e,lo[u]);
	}
	for (let u = g.firstOutput(); u; u = g.nextOutput(u)) {
		steps++;
		let e = fg.join(u,fg.sink); fg.cap(e, hi[u]); fg.floor(e,lo[u]);
	}

	// compute flow(s)
	if (lo0) {
		let [,ts,stats] = flowfloor(fg, trace);
		steps += stats.steps;
	}

	let [ts,stats] = maxflowD(fg, trace);
	steps += stats.steps;
	if (trace)
		ts = g.toString(1,0,u => `${g.x2s(u)}(${lo[u]},${hi[u]})`) +
			 '\nflow graph with floors: ' + ts;

	// construct dcs from flow
	let dcs = new Graph(g.n,g.edgeRange);
	for (let e = g.first(); e; e = g.next(e)) {
		steps++;
		if (fg.f(e)) dcs.join(g.left(e),g.right(e),e);
	}
	if (trace) {
		ts += '\ndcs: ' +
			  dcs.toString(1,0,u => `${dcs.x2s(u)}(${lo[u]},${hi[u]})`);
	}
	return [dcs, ts, { 'size': dcs.m, 'phases': stats.phases,
						 'paths':stats.paths, 'steps': steps}];
}
