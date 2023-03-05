/** @file mcflowJ.cpp
 * 
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import ArrayHeap from '../../dataStructures/heaps/ArrayHeap.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import maxflowD from '../maxflow/maxflowD.mjs';

let g;        // shared reference to flow graph
let link;     // link[u] is parent edge of u
let Cost;     // Cost[u] is pathcost to u, used by findpath
let q;        // queue of vertices, used by findpath

let trace;
let traceString;

let paths;      // number of augmenting paths
let steps;      // number of steps in findpath method

let count = 0;

/** Find minimum cost maximum flow in a weighted flow graph using Jewell's
 *  least-cost augmenting path algorithm.
 *  @param fg is a graph, with a possibly non-zero flow and no unsaturated
 *  negative cycle.
 *  @return [traceString, stats]
 *  @exception throws exception if negative cycle detected
 */
export default function mcflowJ(fg, traceFlag=false) {
	g = fg;
	link = new Int32Array(g.n+1);
	Cost = new Float32Array(g.n+1);
	q = new List(g.n);

	trace = traceFlag; traceString = '';
	paths = steps = 0;

	if (trace) {
		traceString += g.toString(1) + '\n' +
					   'paths with added flow and resulting flow cost\n'
	}
	while (findpath()) {
		augment(); paths++;
	}
	if (trace) traceString += '\n' + g.toString(1);
	return [traceString, { 'paths': paths, 'steps': steps } ];
}

/** Find a least cost augmenting path from source.
 *  @return true on success, false on failure; on success,
 *  the link vector defines a path from the sink back to the source.
 */
function findpath() {
	q.clear(); link.fill(0); Cost.fill(Infinity);

	Cost[g.source] = 0; q.enq(g.source);
	let pass = 0; let last = q.last;
	while (!q.empty()) {
		let u = q.deq();
		for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
			if (g.res(e,u) == 0) continue;
			let v = g.mate(u,e); steps++;
			if (Cost[v] > Cost[u] + g.costFrom(e,u)) {
				Cost[v] = Cost[u] + g.costFrom(e,u); link[v] = e;
				if (!q.contains(v)) q.enq(v);
			}
		}
		if (u == last) {
			assert(pass < g.n, 'mcflowJ: negative cost cycle detected');
			pass++; last = q.last;
		}
	}
	return link[g.sink] ? true : false;
}

/** Augment the flow along augmenting path */
function augment() {
	let u = g.sink; let delta = Infinity;
	for (let e = link[u]; e != 0; e = link[u]) {
		u = g.mate(u,e);
		delta = Math.min(delta, g.res(e,u));
	}

	u = g.sink; let ts = '';
	for (let e = link[u]; e; e = link[u]) {
		steps++;
		u = g.mate(u,e);
		if (trace) {
			if (ts.length > 0) ts = ' ' + ts;
			ts = g.x2s(u) + ':' + g.res(e,u) + ts;
		}
		g.addFlow(e,u,delta);
	}
	if (trace) {
		traceString += `[${ts} ${g.x2s(g.sink)}] ${delta} ${g.totalCost()}\n`;
	}
}
