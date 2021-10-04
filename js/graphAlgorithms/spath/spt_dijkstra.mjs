/** @file spt_dijkstra.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import Dsets from '../../dataStructures/basic/Dsets.mjs';
import Dheap from '../../dataStructures/heaps/Dheap.mjs';
import Graph_w from '../../dataStructures/graphs/Digraph_l.mjs';

/** Compute shortest path tree of a graph using Dijkstra's algorithm.
 *  @param g is a digraph with edge lengths
 *  @param s is a "source vertex" in g
 *  @param trace controls output of information about the internal  
 *  state of the computation; larger values produce more information
 *  @return a triple [elist, dist, ts] where elist is an array of edges in g
 *  that defines an spt rooted at s, dist[u] is the shortest path
 *  distance from vertex s to vertex u (for every u that can be reached
 *  from s and ts is a trace string).
 */
export default function spt_dijkstra(g, s, trace=0) {
	let pedge = new Array(g.n+1).fill(0); let ts = '';
	let dist = new Array(g.n+1).fill(Number.POSITIVE_INFINITY);
	let h = new Dheap(g.n, 2+Math.floor(g.m/g.n));
	if (trace) ts += g + '\n';

	dist[s] = 0; h.insert(s, 0);
	while (!h.empty()) {
		if (trace) {
			let u = h.findmin();
			ts += g.index2string(u) + ' ' +
				  (pedge[u] > 0 ? g.edge2string(pedge[u]) : '-') +
				   ' ' + dist[u] + '\n' + h + '\n\n';
		}
		let u = h.deletemin();
		for (let e = g.firstOut(u); e != 0; e = g.nextOut(u, e)) {
			let v = g.head(e);
			if (dist[v] > dist[u] + g.length(e)) {
				dist[v] = dist[u] + g.length(e); pedge[v] = e;
				if (h.contains(v)) h.changekey(v, dist[v]);
				else h.insert(v, dist[v]);
			}
		}
	}
	return [pedge, dist, ts];
}
