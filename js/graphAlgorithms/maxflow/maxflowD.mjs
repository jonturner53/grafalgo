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
let pedge;		// pedge[u] is edge to u from its parent in shortest path tree
let nextEdge;	// nextEdge[u] is the next edge to be processed at u
let findpathCount; // number of calls to findpath
let findpathSteps; // total steps in findpath
let phaseCount;	   // number of phases

/** Compute a maximum flow in a graph using Dinic's algorithm.
 *  @param fg is Flograph, possibly with some initial flow already present.
 *  @return the total flow added to fg
 */
export default function maxflowD(fg, trace=false) {
	g = fg;
	nextEdge = new Array(g.n+1);
	level = new Array(g.n+1);
	pedge = new Array(g.n+1).fill(0);

	let ts = '';
	if (trace)
		ts += 'augmenting paths with residual capacities\n';

	findpathCount = findpathSteps = phaseCount = 0;
	while (newphase()) {
		phaseCount++;
		while (findpath(g.source)) {
			findpathCount++;
			let [,s] = augment(g, pedge, trace);
			if (trace) ts += s + '\n';
		}
	}
	return [g.totalFlow(), ts,
					{'findpathCount': findpathCount,
					 'findpathSteps': findpathSteps,
					 'phaseCount': phaseCount} ];
}

/** Prepare for next phase of Dinic's algorithm.
 *  This involves recomputing the level array.
 *  @return true if there is still residual capacity from source to sink,
 *  else false
 */
function newphase() {
	for (let u = 1; u <= g.n; u++) {
		level[u] = g.n; nextEdge[u] = g.firstAt(u);
	}
	let q = new List(g.n);
	q.enq(g.source); level[g.source] = 0;
	while (!q.empty()) {
		let u = q.deq();
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u, e)) {
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
		findpathSteps++;
		let v = g.mate(u, e);
		if (g.res(e, u) == 0 || level[v] != level[u] + 1) continue;
		if (v == g.sink || findpath(v)) {
			pedge[v] = e; nextEdge[u] = e; return true;
		}
	}
	nextEdge[u] = 0; return false;
}