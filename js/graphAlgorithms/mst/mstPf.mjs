/** @file mstPf.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import Sets from '../../dataStructures/basic/Sets.mjs';
import FibHeaps from '../../dataStructures/heaps/FibHeaps.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';

/** Compute min spanning tree of a graph using Prim's algorithm with
 *  Fibonacci heaps.
 *  @param g is weighted graph
 *  @param trace turns on trace output when true
 *  @return a tuple [treeEdges, traceString, stats] where treeEdges is an
 *  array listing the edges in the mst (or forest), traceString is a trace
 *  string and stats is a statistics object
 */
export default function mstPf(g, trace=0) {
	let traceString = '';
	if (trace) {
		traceString += g.toString(0,1) + '\n' +
			  'selected vertex, tree edge, heap contents\n';
	}
	let light = new Array(g.n+1).fill(-1);
	let border = new FibHeaps(g.n);
	let inheap = new Int8Array(g.n).fill(false);
	let loopCount = 0;
	for (let s = 1; s <= g.n; s++) {
		if (light[s] >= 0) continue;
		let h = border.insert(s, s, 0); let heapsize = 1; light[s] = 0;
		while (heapsize > 0) {
			let u; [u, h] = border.deletemin(h);
			inheap[u] = false; heapsize--;
			for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
				loopCount++;
				let v = g.mate(u,e);
				if (light[v] < 0) {
					h = border.insert(v, (heapsize > 0 ? h : v), g.weight(e));
					inheap[v] = true; heapsize++; light[v] = e;
				} else if (inheap[v] && g.weight(e) < border.key(v)) {
					h = border.changekey(v,h,g.weight(e)); light[v] = e;
				}
			}
			if (trace) {
				traceString += g.index2string(u) + ' ' +
					  (light[u] != 0 ? g.edge2string(light[u]) : '-')
					  + ' ' + border.heap2string(h) + '\n';
			}
		}
	}
	// convert light into a list of edge numbers
	let j = 0;
	for (let i = 1; i <= g.n; i++)
		if (light[i] > 0) light[j++] = light[i];
	light.length = j;
	let bstats = border.getStats();
	return [light, traceString, {'loopCount': loopCount,
								 'decrease': bstats.decrease,
								 'merge': bstats.merge} ];
}
