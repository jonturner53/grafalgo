/** @file mstP.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import ArrayHeap from '../../dataStructures/heaps/ArrayHeap.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';

/** Compute min spanning tree of a graph using Prim's algorithm.
 *  @param g is weighted graph
 *  @param trace controls the amount of trace output produced, larger
 *  values produce more output
 *  @param d is an optional argument that specfies the base of the border
 *  heap; the default value is 2+floor(g.m/g.n)
 *  @return a tuple [treeEdges, traceString, stats] where treeEdges is an array
 *  listing the edges in the mst (or forest), traceString is a trace string
 *  and stats is a statistics object
 */
export default function mstP(g, trace=0, d=2+Math.floor(g.m/g.n)) {
	let traceString = '';
	if (trace) {
		traceString += g.toString(1) + '\n' +
			  'selected vertex, tree edge, heap contents\n';
	}

	let light = new Array(g.n+1).fill(-1);
	let border = new ArrayHeap(g.n, d);
	let loopCount = 0;
	for (let s = 1; s <= g.n; s++) {
		if (light[s] >= 0) continue;
		border.insert(s, 0); light[s] = 0;
		while (!border.empty()) {
			let u = border.deletemin();
			for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
				loopCount++;
				let v = g.mate(u,e);
				if (light[v] < 0) {
					border.insert(v, g.weight(e)); light[v] = e;
				} else if (border.contains(v) && g.weight(e) < border.key(v)) {
					border.changekey(v, g.weight(e)); light[v] = e;
				}
			}
			if (trace) {
				traceString += g.index2string(u) + ' ' +
					  (light[u] != 0 ? g.edge2string(light[u]) : '-') +
					  ' ' + border + '\n';
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
								 'siftup': bstats.siftup,
								 'siftdown': bstats.siftdown} ];
}
