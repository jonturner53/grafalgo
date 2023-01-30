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

let g;             // shared reference to flow graph
let link;          // link[u] is edge to u from its parent in shortest path tree
let paths;         // number of calls to findpath
let pathsteps;     // total steps in findpath

/** Compute a maximum flow in a graph using the Ford and Fulkerson algorithm.
 *  @param fg is Flograph, possibly with some initial flow already present.
 *  @return the total flow added to fg
 */
export default function maxflowFFmc(fg, trace=false) {
	g = fg; link = new Int32Array(g.n+1);
	let ts = '';
	if (trace)
		ts += 'augmenting paths with residual capacities\n';
	paths = pathsteps = 0;
	while (findpath(g.source)) {
		paths++;
		let [,s] = augment(g, link, trace);
		if (trace) ts += s + '\n';
	}
	if (trace) ts += '\n' + g.toString(1);
	return [ts, {'paths': paths,
				 'pathsteps': pathsteps}];
}

/** Find a max capacity augmenting path from a specified vertex to the sink.
 *  @param s is a vertex in g
 *  @return true if there is an augmenting path from u to the sink
 */
function findpath(s) {
	let border = new ArrayHeap(g.n, 2+g.m/g.n);
	let cap = new Int32Array(g.n+1);

	link.fill(0);
	cap[s] = 0x7fffffff; // largest 32 bit value
	border.insert(s, -cap[s]); // so deletemin gives max cap
	while (!border.empty()) {
		let u = border.deletemin();
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			pathsteps++;
			let v = g.mate(u,e);
	    	if (Math.min(cap[u], g.res(e,u)) > cap[v]) {
				cap[v] = Math.min(cap[u], g.res(e,u));
				link[v] = e;
				if (v == g.sink) {
					pathsteps += heapStats.siftup + heapStats.siftdown;
					return true;
				}
				if (border.contains(v))
		    		border.changekey(v,-cap[v]);
				else
				    border.insert(v,-cap[v]);
			}
		}
	}
	let heapStats = border.getStats();
	pathsteps += heapStats.upsteps + heapStats.downsteps;
    return false;
}
