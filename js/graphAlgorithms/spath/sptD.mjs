/** @file sptD.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import ArrayHeap from '../../dataStructures/heaps/ArrayHeap.mjs';

/** Compute shortest path tree of a graph using Dijkstra's algorithm.
 *  @param g is a digraph with edge lengths
 *  @param s is a "source vertex" in g
 *  @param trace controls output of information about the internal  
 *  state of the computation; larger values produce more information
 *  @return a tuple [error, pedge, dist, ts, stats] where error is an empty
 *  string on success and an error string on failure, pedge[u] is the edge from
 *  the parent of u to u in the spt rooted at s (or 0 if u unreachable);
 *  dist[u] is the shortest path distance from vertex s to vertex u
 *  (or infinity if u unreachable), ts is a trace string and stats is a
 *  statistics object.
 */
export default function sptD(g, s, trace=0) {
	let pedge = new Array(g.n+1).fill(0); let ts = '';
	let dist = new Array(g.n+1).fill(Number.POSITIVE_INFINITY);
	let h = new ArrayHeap(g.n, 2+Math.floor(g.m/g.n));
	if (trace) ts += g.toString(0,1);

	dist[s] = 0; h.insert(s, 0);
	if (trace) ts += 'initial heap: ' + h + '\n\n' +
					 'selected vertex, edge to parent, ' + 
					 `distance from ${g.index2string(s)}, heap contents\n`;
	while (!h.empty()) {
		let u = h.deletemin();
		for (let e = g.firstOut(u); e != 0; e = g.nextOut(u, e)) {
			if (g.length(e) < 0)
				return [ `Error: negative edge ${g.edge2string(e)}.`,
						pedge, dist, ts,  h.getStats()];
			let v = g.head(e);
			if (dist[v] > dist[u] + g.length(e)) {
				dist[v] = dist[u] + g.length(e); pedge[v] = e;
				if (h.contains(v)) h.changekey(v, dist[v]);
				else h.insert(v, dist[v]);
			}
		}
		if (trace) {
			ts += g.index2string(u) + ' ' +
				  (pedge[u] > 0 ? g.edge2string(pedge[u]) : '-') +
				   ' ' + dist[u] + ' ' + h + '\n';
		}
	}
	return ['', pedge, dist, ts,  h.getStats()];
}
