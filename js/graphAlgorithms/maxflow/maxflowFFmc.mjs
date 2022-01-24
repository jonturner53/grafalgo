/** @file maxflowFFmc.mjs
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
let findpathCount; // number of calls to findpath
let findpathSteps; // total steps in findpath

/** Compute a maximum flow in a graph using the Ford and Fulkerson algorithm.
 *  @param fg is Flograph, possibly with some initial flow already present.
 *  @return the total flow added to fg
 */
export default function maxflowFFmc(fg, trace=false) {
	g = fg; pedge = new Array(g.n+1);
	let ts = '';
	if (trace)
		ts += 'augmenting paths with residual capacities\n';
	let tf = 0;
	findpathCount = findpathSteps = 0;
	while (findpath(g.source)) {
		findpathCount++;
		let [f,s] = augment(g, pedge, trace);
		tf += f; if (trace) ts += s + '\n';
	}
	return [tf, ts, {'findpathCount': findpathCount,
					 'findpathSteps': findpathSteps}];
}

/** Find a max capacity augmenting path from a specified vertex to the sink.
 *  @param s is a vertex in g
 *  @return true if there is an augmenting path from u to the sink
 */
function findpath(s) {
	let nabors = new ArrayHeap(g.n, 2+g.m/g.n);
	let bcap = new Array(g.n+1).fill(0);

	pedge.fill(0);
	bcap[s] = Infinity;
	nabors.insert(s, -bcap[s]); // so deletemin gives max cap
	while (!nabors.empty()) {
		let u = nabors.deletemin();
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			findpathSteps++;
			let v = g.mate(u,e);
	    	if (Math.min(bcap[u], g.res(e,u)) > bcap[v]) {
				bcap[v] = Math.min(bcap[u], g.res(e,u));
				pedge[v] = e;
				if (v == g.sink) return true;
				if (nabors.contains(v))
		    		nabors.changekey(v,-bcap[v]);
				else
				    nabors.insert(v,-bcap[v]);
			}
		}
	}
	let heapStats = nabors.getStats();
	findpathSteps += heapStats.siftup + heapStats.siftdown;
    return false;
}
