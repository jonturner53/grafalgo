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
	let pedge = new Array(g.n+1).fill(0); let traceString = '';
	let fh = new Fheaps(g.n);
	if (trace) {
		traceString += g.toString(0,1) + '\n' +
					   'selected vertex, tree edge, heap contents\n';
	}
	let mark = new Array(g.n).fill(false);
	let inheap = new Array(g.n).fill(false);
	for (let s = 1; s <= g.n; s++) {
		if (mark[s]) continue;
		mark[s] = true;
		let root = fh.insert(s, s, 0); let heapsize = 1; pedge[s] = 0;
		while (heapsize > 0) {
			let u = fh.findmin(root); root = fh.deletemin(root);
			inheap[u] = false; heapsize--;
			for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
				let v = g.mate(u,e);
				if (!mark[v]) {
					root = fh.insert(v, (heapsize > 0 ? root : v), g.weight(e));
					inheap[v] = true; heapsize++; pedge[v] = e; mark[v] = true;
				} else if (inheap[v] && g.weight(e) < fh.key(v)) {
					root = fh.changekey(v, root, g.weight(e)); pedge[v] = e;
				}
			}
			if (trace) {
				traceString += g.index2string(u) + ' ' +
							   (pedge[u] != 0 ? g.edge2string(pedge[u]) : '-')
							   + ' ' + fh.heap2string(root) + '\n';
			}
		}
	}
	return ['', pedge, traceString, fh.getStats() ];
}
