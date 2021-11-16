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
 *  @return a tuple [error, elist, traceString,  stats] where error is
 *  an error message of '' if no errors, elist is a list of edges that
 *  defines an mst in g or a minimum spanning forest, if g is not connected,
 *  ts is a trace string and stats is a statistics object
 */
export default function mst_prim(g, trace=0) {
	let elist = []; let traceString = '';
	let light = new Array(g.n+1).fill(-1);
	let boundary = new Dheap(g.n);

	if (trace) {
		traceString += g.toString(0,1) + '\n' +
					   'selected vertex, tree edge, heap contents\n';
	}
	for (let s = 1; s <= g.n; s++) {
		if (light[s] >= 0) continue;
		boundary.insert(s, 0); light[s] = 0;
		while (!boundary.empty()) {
			let u = boundary.deletemin();
			for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
				let v = g.mate(u,e);
				if (light[v] < 0) {
					boundary.insert(v, g.weight(e)); light[v] = e;
				} else if (boundary.contains(v) &&
						   g.weight(e) < boundary.key(v)) {
					boundary.changekey(v, g.weight(e)); light[v] = e;
				}
			}
			if (trace) {
				traceString += g.index2string(u) + ' ' +
							   (light[u] != 0 ? g.edge2string(light[u]) : '-') +
								' ' + boundary + '\n';
			}
		}
	}
	return ['', light, traceString, boundary.getStats()];
}
