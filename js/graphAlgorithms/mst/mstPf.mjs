/** @file mstPf.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
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
		traceString += g.toString(1) + '\n' +
			  'selected vertex, tree edge, heap contents\n';
	}
	let link = new Array(g.n+1).fill(-1);
	let border = new FibHeaps(g.n);
	let inheap = new Int8Array(g.n+1).fill(false);
	let steps = 0;
	for (let s = 1; s <= g.n; s++) {
		if (link[s] >= 0) continue;
		let h = border.insert(s, s, 0); let heapsize = 1; link[s] = 0;
		while (heapsize > 0) {
			let u; [u, h] = border.deletemin(h);
			inheap[u] = false; heapsize--;
			for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
				steps++;
				let v = g.mate(u,e);
				if (link[v] < 0) {
					h = border.insert(v, (heapsize > 0 ? h : v), g.weight(e));
					inheap[v] = true; heapsize++; link[v] = e;
				} else if (inheap[v] && g.weight(e) < border.key(v)) {
					h = border.changekey(v,h,g.weight(e)); link[v] = e;
				}
			}
			if (trace) {
				traceString += g.x2s(u) + ' ' +
					  (link[u] != 0 ? g.e2s(link[u]) : '-')
					  + ' ' + border.toString(0,0,h) + '\n';
			}
		}
	}
	// convert link into a list of edge numbers
	let j = 0;
	for (let i = 1; i <= g.n; i++)
		if (link[i] > 0) link[j++] = link[i];
	link.length = j;
	let stats = border.getStats(); stats.steps += steps;
	return [link, traceString, stats];
}
