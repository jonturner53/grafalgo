/** @file pmatchO.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import findSplit from '../misc/findSplit.mjs';
import maxflowD from '../maxflow/maxflowD.mjs';
import flowfloor from '../maxflow/flowfloor.mjs';
import Matching from '../match/Matching.mjs';

/** Compute a maximum priority matching in a graph by reducing it to a
 *  weighted matching problem and applying a specified algorithm.
 *  Vertices with non-positive priority may be left unmatched.
 *  @param g0 is an undirected graph
 *  @param priority maps a vertex u to a non-negative integer priority;
 *  larger values imply higher priority
 *  @param algo is a weighted matching algorithm; if it's a bipartite
 *  matching algorithm, g0 is assumed to be bipartite
 *  @param trace causes a trace string to be returned when true
 *  @exceptions throws an exception if graph is not bipartite
 */
export default function pmatchO(g0, prio, algo, trace=false) {
	let g = new Graph(g0.n, g0.edgeRange); g.assign(g0);
	for (let e = g.first(); e; e = g.next(e)) {
		let [u,v] = [g.left(e),g.right(e)];
		g.weight(e, prio[u] + prio[v]);
	}
	let ts = '';
	if (trace) {
		ts += g0.toString(1,0,u => g0.x2s(u) + ':' + prio[u]);
	}
	let [match0,,stats0] = algo(g);
	if (!match0) return [];
	let match = new Matching(g0);
	for (let e = match0.first(); e; e = match0.next(e))
		match.add(e);
	if (trace)
		ts += `matching: ${match.toString()}\n`;
	let psum = 0;
	for (let u = 1; u <= g.n; u++) 
		if (match.at(u)) psum += prio[u];
	let stats = { 'size': match.size(), 'psum': psum,
				  'steps': stats0.steps + g.n };
	return [match, ts, stats];
}

