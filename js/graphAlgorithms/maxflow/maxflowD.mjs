/** @file maxflowD.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import augment from './augment.mjs';

let g;			// shared reference to flow graph
let level;		// level[u] is distance from source to u in residual graph
let link;		// link[u] is edge to u from its parent in augmenting path
let nextEdge;	// nextEdge[u] is the next edge to be processed at u

let phases;	    // number of phases
let paths;      // number of calls to findpath
let steps;      // total steps

/** Compute a maximum flow in a graph using Dinic's algorithm.
 *  @param fg is Flograph, possibly with some initial flow already present.
 *  @return pair [ts, stats] where ts is a trace string and stats is a
 *  statistics object
 */
export default function maxflowD(fg, trace=false) {
	g = fg;
	nextEdge = new Int32Array(g.n+1);
	level = new Int32Array(g.n+1);
	link = new Int32Array(g.n+1);

	let ts = '';
	if (trace)
		ts += 'augmenting paths with residual capacities\n';

	phases = paths = steps = 0;
	while (newphase()) {
		phases++;
		while (findpath(g.source)) {
			paths++;
			let [,s,augsteps] = augment(g, link, trace);
			if (trace) ts += s + '\n';
			steps += augsteps;
		}
	}
	if (trace) ts += '\n' + g.toString(1);
	return [ts, {'flow': g.flowStats().totalFlow,
                 'phases': phases, 'paths': paths, 'steps': steps} ];
}

/** Prepare for next phase of Dinic's algorithm.
 *  This involves recomputing the level array.
 *  @return true if there is still residual capacity from source to sink,
 *  else false
 */
function newphase() {
	for (let u = 1; u <= g.n; u++) {
		level[u] = g.n; nextEdge[u] = g.firstAt(u); steps++;
	}
	let q = new List(g.n);
	q.enq(g.source); level[g.source] = 0;
	while (!q.empty()) {
		let u = q.deq();
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u, e)) {
			steps++;
			let v = g.mate(u, e);
			if (g.res(e, u) > 0 && level[v] == g.n) {
				level[v] = level[u] + 1;
				if (v == g.sink) return true;
				q.enq(v);
			}
		}
	}
	return false;
}

/** Find an augmenting path from specified vertex to sink in residual graph.
 *  @param u is a vertex
 *  @return true if there is an augmenting path from u to the sink
 */
function findpath(u) {
	for (let e = nextEdge[u]; e != 0; e = g.nextAt(u, e)) {
		steps++;
		let v = g.mate(u, e);
		if (g.res(e, u) == 0 || level[v] != level[u] + 1) continue;
		if (v == g.sink || findpath(v)) {
			link[v] = e; nextEdge[u] = e; return true;
		}
	}
	nextEdge[u] = 0; return false;
}
