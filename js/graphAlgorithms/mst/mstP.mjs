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
 *  @param d is an optional argument that specfies the base of the border
 *  heap; the default value is 2+floor(g.m/g.n)
 *  @param trace controls the amount of trace output produced, larger
 *  values produce more output
 *  @return a tuple [treeEdges, traceString, stats] where treeEdges is an array
 *  listing the edges in the mst (or forest), traceString is a trace string
 *  and stats is a statistics object
 */
export default function mstP(g, d=2+Math.floor(g.m/g.n), trace) {
	let traceString = '';
	if (trace) {
		traceString += g.toString(1) + '\n' +
			  'selected vertex, tree edge, heap contents\n';
	}

	let link = new Array(g.n+1).fill(-1);
	let border = new ArrayHeap(g.n, d);
	let steps = 0;
	for (let s = 1; s <= g.n; s++) {
		if (link[s] >= 0) continue;
		border.insert(s, 0); link[s] = 0;
		while (!border.empty()) {
			let u = border.deletemin();
			for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
				steps++;
				let v = g.mate(u,e);
				if (link[v] < 0) {
					border.insert(v, g.weight(e)); link[v] = e;
				} else if (border.contains(v) && g.weight(e) < border.key(v)) {
					border.changekey(v, g.weight(e)); link[v] = e;
				}
			}
			if (trace) {
				traceString += g.x2s(u) + ' ' +
					  (link[u] != 0 ? g.e2s(link[u]) : '-') +
					  ' ' + border + '\n';
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
