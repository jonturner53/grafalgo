/** @file mst_primf.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import Dsets from '../../dataStructures/basic/Dsets.mjs';
import Fheaps from '../../dataStructures/heaps/Fheaps.mjs';
import Graph_w from '../../dataStructures/graphs/Graph_w.mjs';

/** Compute min spanning tree of a graph using Prim's algorithm with
 *  Fibonacci heaps.
 *  @param g is weighted graph
 *  @param trace turns on trace output when true
 *  @return a tuple [error, elist, traceString,  stats] where error is
 *  an error message of '' if no errors, elist is a list of edges that
 *  defines an mst in g or a minimum spanning forest, if g is not connected,
 *  ts is a trace string and stats is a statistics object
 */
export default function mst_primf(g, trace=0) {
	let light = new Array(g.n+1).fill(-1); let traceString = '';
	let boundary = new Fheaps(g.n);
	if (trace) {
		traceString += g.toString(0,1) + '\n' +
					   'selected vertex, tree edge, heap contents\n';
	}
	let inheap = new Array(g.n).fill(false);
	for (let s = 1; s <= g.n; s++) {
		if (light[s] >= 0) continue;
		let root = boundary.insert(s, s, 0); let heapsize = 1; light[s] = 0;
		while (heapsize > 0) {
			let u = boundary.findmin(root); root = boundary.deletemin(root);
			inheap[u] = false; heapsize--;
			for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
				let v = g.mate(u,e);
				if (light[v] < 0) {
					root = boundary.insert(
								v, (heapsize > 0 ? root : v), g.weight(e));
					inheap[v] = true; heapsize++; light[v] = e;
				} else if (inheap[v] && g.weight(e) < boundary.key(v)) {
					root = boundary.changekey(v,root,g.weight(e)); light[v] = e;
				}
			}
			if (trace) {
				traceString += g.index2string(u) + ' ' +
							   (light[u] != 0 ? g.edge2string(light[u]) : '-')
							   + ' ' + boundary.heap2string(root) + '\n';
			}
		}
	}
	return ['', light, traceString, boundary.getStats() ];
}
