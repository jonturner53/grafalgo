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
 *  @param trace controls the amount of trace output produced, larger
 *  values produce more output
 *  @return a list of edges that defines an mst in g or a minimum
 *  spanning forest, if g is not connected; also a trace string
 *  and a statistics object
 */
export default function mst_primf(g, trace=0) {
	let elist = []; let traceString = '';
	let light = new Array(g.n+1).fill(0);
	let fh = new Fheaps(g.n);
	if (trace) traceString += g.toString(0,1) + '\n';
	let mark = new Array(g.n).fill(false);
	let inheap = new Array(g.n).fill(false);
	for (let s = 1; s <= g.n; s++) {
		if (mark[s]) continue;
		mark[s] = true;
		let heapsize = 0; let root = 0;
		for (let e = g.firstAt(s); e != 0; e = g.nextAt(s,e)) {
			let u = g.mate(s, e);
			root = fh.insert(u, (heapsize > 0 ? root : u), g.weight(e));
			light[u] = e; inheap[u] = true; heapsize++;
		}
		light[s] = 1;	// dummy value, anything non-zero will do
		traceString += g.index2string(s) + ' ' + fh.heap2string(root) + '\n';
		while (heapsize > 0) {
			if (trace) {
				let u = fh.findmin(root);
				traceString += g.index2string(u) + ' ' +
							   g.edge2string(light[u]) + ' ';
			}
			let u = fh.findmin(root); root = fh.deletemin(root);
			inheap[u] = false; heapsize--;
			elist.push(light[u]);
			for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
				let v = g.mate(u,e); mark[v] = true;
				if (inheap[v] && g.weight(e) < fh.key(v)) {
					root = fh.changeKey(v, root, g.weight(e));
					light[v] = e;
				} else if (!inheap[v] && light[v] == 0) {
					root = fh.insert(v, (heapsize > 0 ? root : v), g.weight(e));
					inheap[v] = true; heapsize++; light[v] = e;
				}
			}
			if (trace) traceString += fh.heap2string(root) + '\n';
		}
	}
	return [elist, traceString, fh.getStats() ];
}
