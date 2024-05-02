/** @file dcsT.mjs
 *
 *  @author Jon Turner
 *  @date 2024
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import matchEG from '../match/matchEG.mjs';
import pmatchO from './pmatchO.mjs';

/** Compute a degree-constrained subgraph in a general graph
 *  using Tutte's reduction to a matching problem.
 *  @param g is an undirected bipartite graph
 *  @param hi is an array mapping vertices to degree upper bounds;
 *  if omitted a bound of 1 is used
 *  @param lo is an array mapping vertices to degree lower bounds;
 *  if omitted a bound of 0 is used
 *  @return a triple [dcs, ts, stats] where dcs is a Graph object;
 *  ts is a possibly empty trace string and stats is a statistics object;
 *  if lo>0, the returned dcs will satisfy the
 *  specified minimum degree requirements if it is possible to do so
 *  @param trace causes a trace string to be returned when true
 */
export default function dcsT(g, hi, lo=0, trace=0) {
	let steps = 0; let traceString = '';
	
	let lo0 = lo;
	if (!lo) lo = new Int32Array(g.n+1);
	if (trace) {
		traceString += g.toString(1,0,u => `${g.x2s(u)}(${lo[u]},${hi[u]})`);
	}

	// preliminaries
	let n = 0; let m = g.m;
	let d = new Int32Array(g.n+1);    // d[u]=degree(u)
	let base = new Int32Array(g.n+1); // base[u]=first vertex in u's cluster
	let b = 1;
	for (let u = 1; u <= g.n; u++) {
		d[u] = g.degree(u); base[u] = b;
		assert(0 <= hi[u] && hi[u] <= d[u]);
		assert(!lo0 || 0 <= lo[u] && lo[u] <= hi[u]);
		let nu = 2*d[u] - (lo0 ? lo[u] : hi[u]);
		b += nu; n += nu; m += d[u]*(nu-d[u]);
		steps++;
	}

	let mg = new Graph(n, m >= g.edgeRange ? m : g.edgeRange);
	// define inter-custer edges
	let offset = new Int32Array(g.n+1);
		// offset[u] determines position of next edge in u's cluster
	for (let e = g.first(); e; e = g.next(e)) {
		let [u,v] = [g.left(e),g.right(e)];
		mg.join(base[u] + offset[u]++, base[v] + offset[v]++, e); 
		if (g.hasWeights) mg.weight(e, g.weight(e)+1);
		steps++;
	}
	// define intra-cluster edges
	let prio = (lo0 ? new Int32Array(mg.n+1) : 0);
	for (let u = 1; u <= g.n; u++) {
		let nu = (u < g.n ? base[u+1] : mg.n+1) - base[u];
		for (let i = 0; i < d[u]; i++) {
			if (lo0) prio[base[u]+i] = 1;
			for (let j = d[u]; j < nu; j++) {
				let me = mg.join(base[u]+i, base[u]+j);
				if (g.hasWeights) mg.weight(me, 1);
				steps++;
			}
		}
		if (lo0) {
			for (let i = d[u]; i < 2*d[u]-hi[u]; i++) {
				prio[base[u]+i] = 2; steps++;
			}
		}
	}
	let [match,,stats] = (lo0 ? pmatchO(mg,prio) : 
						  (g.hasWeights ? wmatchE(mg) : matchEG(mg)));
	steps += stats.steps;

	let dcs = new Graph(g.n,g.edgeRange);
	for (let e = match.first(); e; e = match.next(e)) {
		if (g.validEdge(e)) {
			dcs.join(g.left(e), g.right(e), e);
			if (g.hasWeights) dcs.weight(e, g.weight(e));
		}
		steps++;
	}
	if (trace) {
		traceString += '\ndcs: ' +
			  dcs.toString(1,0,u => `${dcs.x2s(u)}(${lo[u]},${hi[u]})`);
	}

	return [dcs, traceString, {'steps': steps}];
}

