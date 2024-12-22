/** @file pmatchO.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import findSplit from '../misc/findSplit.mjs';
import wbimatchH from '../match/wbimatchH.mjs';
import wmatchE from '../match/wmatchE.mjs';
import Matching from '../match/Matching.mjs';

/** Compute a maximum priority matching in a graph using Okumura's reduction
 *  to a weighted matching problem. For graphs with edge weights, the returned
 *  matching has maximum weight among all max priority matchings.
 *  Priorites are assumed to be non-negative.
 *  @param G is an undirected graph
 *  @param priority maps a vertex u to a non-negative integer priority;
 *  larger values imply higher priority
 *  @param trace causes a trace string to be returned when true
 *  @exceptions throws an exception if graph is not bipartite
 */
export default function pmatchO(G, prio, trace=false) {
	let g = new Graph(G.n, G.edgeRange); g.assign(G);
	
	let W = 0;
	for (let e = g.first(); e; e = g.next(e))
		W = Math.max(W,g.weight(e));
	if (W == 0) W = 1;
	for (let e = g.first(); e; e = g.next(e)) {
		let [u,v] = [g.left(e),g.right(e)];
		g.weight(e, g.weight(e) + (prio[u] + prio[v]) * g.n*W/2);
	}

	let ts = '';
	if (trace) {
		ts += G.toString(3,0,u => G.x2s(u) + ':' + prio[u]);
	}

	let [wmatch,,stats0] = g.hasBipartition ? wbimatchH(g) : wmatchE(g);

	if (!wmatch) return [];
	let match = new Matching(G);
	for (let e = wmatch.first(); e; e = wmatch.next(e))
		match.add(e);
	if (trace)
		ts += `matching: ${match.toString()}\n`;
	let psum = 0;
	for (let u = 1; u <= g.n; u++) 
		if (match.at(u)) psum += prio[u];
	let stats = { 'size': match.size(), 'psum': psum,
				  'steps': stats0.steps + g.n};
	if (G.hasWeights) stats.weight = match.weight();
	return [match, ts, stats];
}
