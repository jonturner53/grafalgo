/** @file mst_primf.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import Sets from '../../dataStructures/basic/Sets.mjs';
import Fheaps from '../../dataStructures/heaps/Fheaps.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';

/** Compute min spanning tree of a graph using Prim's algorithm with
 *  Fibonacci heaps.
 *  @param g is weighted graph
 *  @param trace turns on trace output when true
 *  @return a tuple [treeEdges, traceString, stats] where treeEdges is an
 *  array listing the edges in the mst (or forest), traceString is a trace
 *  string and stats is a statistics object
 */
export default function mst_primf(g, trace=0) {
	let traceString = '';
	if (trace) {
		traceString += g.toString(0,1) + '\n' +
			  'selected vertex, tree edge, heap contents\n';
	}
	let light = new Array(g.n+1).fill(-1);
	let border = new Fheaps(g.n);
	let inheap = new Array(g.n).fill(false);
	for (let s = 1; s <= g.n; s++) {
		if (light[s] >= 0) continue;
		let root = border.insert(s, s, 0); let heapsize = 1; light[s] = 0;
		while (heapsize > 0) {
			let u = border.findmin(root); root = border.deletemin(root);
			inheap[u] = false; heapsize--;
			for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
				let v = g.mate(u,e);
				if (light[v] < 0) {
					root = border.insert(
								v, (heapsize > 0 ? root : v), g.weight(e));
					inheap[v] = true; heapsize++; light[v] = e;
				} else if (inheap[v] && g.weight(e) < border.key(v)) {
					root = border.changekey(v,root,g.weight(e)); light[v] = e;
				}
			}
			if (trace) {
				traceString += g.index2string(u) + ' ' +
					  (light[u] != 0 ? g.edge2string(light[u]) : '-')
					  + ' ' + border.heap2string(root) + '\n';
			}
		}
	}
	// convert light into a list of edge numbers
	let j = 0;
	for (let i = 1; i <= g.n; i++)
		if (light[i] > 0) light[j++] = light[i];
	light.length = j;
	return [light, traceString, border.getStats() ];
}
