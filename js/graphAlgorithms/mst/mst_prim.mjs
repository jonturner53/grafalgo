/** @file mst_prim.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import Dsets from '../../dataStructures/basic/Dsets.mjs';
import Dheap from '../../dataStructures/heaps/Dheap.mjs';
import Graph_w from '../../dataStructures/graphs/Graph_w.mjs';

/** Compute min spanning tree of a graph using Prim's algorithm.
 *  @param g is weighted graph
 *  @param trace controls the amount of trace output produced, larger
 *  values produce more output
 *  @return a list of edges that defines an mst in g or a minimum
 *  spanning forest, if g is not connected; also a trace string
 *  and a statistics object
 */
export default function mst_prim(g, trace=0) {
	let elist = []; let traceString = '';
	let light = new Array(g.n+1).fill(0);
	let h = new Dheap(g.n);

	if (trace) traceString += g + '\n';
	let mark = new Array(g.n).fill(false);
	for (let s = 1; s <= g.n; s++) {
		if (mark[s]) continue;
		mark[s] = true;
		for (let e = g.firstAt(s); e != 0; e = g.nextAt(s,e)) {
			let u = g.mate(s,e); h.insert(u, g.weight(e)); light[u] = e;
		}
		light[s] = 1;	// dummy value, anything non-zero will do
		while (!h.empty()) {
			if (trace) {
				let u = h.findmin();
				traceString += g.index2string(u) + ' ' +
							   g.edge2string(light[u]) + ' ' +
							   g.elist2string(elist) + '\n' + h +'\n\n';
			}
			let u = h.deletemin(); elist.push(light[u]);
			for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
				let v = g.mate(u,e); mark[v] = true;
				if (h.contains(v) && g.weight(e) < h.key(v)) {
					h.changekey(v, g.weight(e)); light[v] = e;
				} else if (!h.contains(v) && light[v] == 0) {
					h.insert(v, g.weight(e)); light[v] = e;
				}
			}
		}
	}
	return [elist, traceString, h.getStats() ];
}
