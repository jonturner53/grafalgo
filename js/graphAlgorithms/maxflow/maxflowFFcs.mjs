/** @file maxflowFFcs.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import ArrayHeap from '../../dataStructures/heaps/ArrayHeap.mjs';
import augment from './augment.mjs';

let g;			// shared reference to flow graph
let pedge;		// pedge[u] is edge to u from its parent in shortest path tree
let scale;		// scaling parameter

let findpathCount; // number of calls to findpath
let findpathSteps; // total steps in findpath

/** Compute a maximum flow in a graph using the capacity scaling variant of
 *  the Ford and Fulkerson algorithm.
 *  @param fg is Flograph, possibly with some initial flow already present.
 *  @return the total flow added to fg
 */
export default function maxflowFFmc(fg, trace=false) {
	g = fg; pedge = new Int32Array(g.n+1);
	let ts = '';
	if (trace)
		ts += 'augmenting paths with residual capacities\n';
	findpathCount = findpathSteps = 0;

	// initialize scale factor to largest power of 2
	// that is <= (max edge capacity)/2
	let maxCap = 0;
	for (let e = g.first(); e != 0; e = g.next(e)) 
		maxCap = Math.max(maxCap, g.cap(e, g.tail(e)));
	for (scale = 1; scale <= maxCap/2; scale *= 2) {}   

	while (findpath(g.source)) {
		findpathCount++;
		let [,s] = augment(g, pedge, trace);
		if (trace) ts += s + '\n';
	}
	return [g.totalFlow(), ts,
					{'findpathCount': findpathCount,
					 'findpathSteps': findpathSteps}];
}

/** Find a max capacity augmenting path from a specified vertex to the sink.
 *  @param s is a vertex in g
 *  @return true if there is an augmenting path from u to the sink
 */
function findpath(s) {
	let q = new List(g.n);

	while (scale > 0) {
		pedge.fill(0);
		q.enq(g.source);
		while (!q.empty()) {
			let u = q.deq();
			for (let e = g.firstAt(u); e != 0; e=g.nextAt(u,e)) {
				findpathSteps++;
				let v = g.mate(u,e);
				if (g.res(e,u) >= scale && pedge[v] == 0 && v != g.source) {
					pedge[v] = e; 
					if (v == g.sink) return true;
					q.enq(v);
				}
			}
		}
		scale /= 2;
	}
	return false;
}
