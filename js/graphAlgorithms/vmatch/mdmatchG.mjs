/** @file mdmatchG.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../common/Assert.mjs';
import ListPair from '../../dataStructures/basic/ListPair.mjs';
import Matching from '../match/Matching.mjs';
import bimatchHK from '../match/bimatchHK.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';

let traceString;

let steps;		// number of steps (inner loops)

/** Compute a matching in a bipartite graph that matches all vertices
 *  of maximum degree, using Gabow's algorithm; note, may not be max size.
 *  @param g is an undirected bipartite graph
 *  @param trace causes a trace string to be returned when true
 *  @return a triple [match, ts, stats] is a matching object,
 *  ts is a possibly empty trace string and stats is a statistics object;
 *  the coloring is returned as integer edge weights in g
 */
export default function mdmatchG(g, trace=0) {
	assert(g.bipartite);
	let io = new ListPair(g.n);
	for (let u = g.firstInput(); u; u = g.nextInput(u)) io.swap(u);

	// initialize supporting data structures
	let degree = new Int32Array(g.n+1);
	let steps = g.n;
	let Delta = 0;
	for (let u = 1; u <= g.n; u++) {
		degree[u] = g.degree(u);
		if (degree[u] > Delta) Delta = degree[u];
		steps++;
	}

	let traceString = '';
	if (trace) traceString += `graph: ${g.toString(1)}\n`;

	// compute subgraph xg1 that includes all edges incident to max degree
	// inputs; then get its matching
	let xg1 = new Graph(g.n,g.edgeRange); // scratch graph
	for (let e = g.first(); e; e = g.next(e)) {
		let [u,v] = [g.input(e),g.output(e)]
		if (degree[u] == Delta) xg1.join(u,v,e);
		steps++;
	}
	xg1.split(io);
	let [xmatch1,ts,stats1] = bimatchHK(xg1);
	steps += stats1.steps;
	if (trace) traceString += `first matching: ${xmatch1.toString()}\n`;

	// compute xg2, including edges incident to max degree outputs
	let xg2 = new Graph(g.n,g.edgeRange); // scratch graph
	for (let e = g.first(); e; e = g.next(e)) {
		let [u,v] = [g.input(e),g.output(e)];
		if (degree[v] == Delta) xg2.join(u,v,e);
		steps++;
	}
	xg2.split(io);
	let [xmatch2,,stats2] = bimatchHK(xg2);
	steps += stats2.steps;
	if (trace)
		traceString += `second matching: ${xmatch2.toString()}\n`;

	// Include edges from both matchings in match and discard
	let match = new Matching(g); let nexte;
	for (let e = xmatch1.first(); e; e = nexte) {
		nexte = xmatch1.next(e);
		if (xmatch2.contains(e)) {
			match.add(e); xmatch1.drop(e); xmatch2.drop(e);
		}
		steps++;
	}

	// remaining edges in xmatch1,2 define alternating paths or cycles
	while (xmatch1.size() && xmatch2.size()) {
		let e = xmatch1.first();
		let u = selectStart(e, g, xmatch1, xmatch2, degree, Delta);
		let v = u;
		while (xmatch1.at(v)) {
			let ee = xmatch1.at(v); match.add(ee); xmatch1.drop(ee);
			v = g.mate(v,ee); ee = xmatch2.at(v);
			if (!ee) break;
			v = g.mate(v,ee); xmatch2.drop(ee); steps++;
		}
		v = u;
		while (xmatch2.at(v)) {
			let ee = xmatch2.at(v); match.add(ee); xmatch2.drop(ee);
			v = g.mate(v,ee); ee = xmatch1.at(v);
			if (!ee) break;
			v = g.mate(v,ee); xmatch1.drop(ee); steps++;
		}
	}
	while (xmatch1.size()) {
		let e = xmatch1.first(); match.add(e); xmatch1.drop(e); steps++;
	}
	while (xmatch2.size()) {
		let e = xmatch2.first(); match.add(e); xmatch2.drop(e); steps++;
	}

	if (trace)
		traceString += `final matching: ${match.toString()}\n`;
	return [match,traceString,{'size': match.size(), 'steps': steps}];
}

/** Select the "start" vertex of a component of xmatch1 xor xmatch2.
 *  @param e is an edge in xmatch1
 *  @return a vertex u; if e's component is an odd length path, either endpoint
 *  will do; if it is an even length path, select the max degree endpoint;
 *  if it is a cycle, any vertex on the cycle will do.
 */
function selectStart(e, g, xmatch1, xmatch2, degree, Delta) {
	// find first endpoint
	let [u,v] = [g.left(e),g.right(e)];
	while (true) {
		steps++;
		let ee = xmatch2.at(v); if (!ee) break; v = g.mate(v,ee);
		if (v == u) return u; // component is a cycle
			ee = xmatch1.at(v); if (!ee) break; v = g.mate(v,ee);
	}
	// component is a path and v is its "rightmost" endpoint
	while (true) {
		steps++;
		let ee = xmatch2.at(u); if (!ee) break; u = g.mate(u,ee);
			ee = xmatch1.at(u); if (!ee) break; u = g.mate(u,ee);
	}
	// now u is its "leftmost" endpoint
	return degree[u] == Delta ? u : v;
}
