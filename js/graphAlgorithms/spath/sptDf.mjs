/** @file sptDf.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import FibHeaps from '../../dataStructures/heaps/FibHeaps.mjs';

/** Compute shortest path tree of a graph using Dijkstra's algorithm.
 *  @param g is a digraph with edge lengths
 *  @param s is a "source vertex" in g
 *  @param trace controls output of information about the internal  
 *  state of the computation; larger values produce more information
 *  @return a tuple [link, dist, ts, stats] where link[u] is the edge from
 *  the parent of u to u in the spt rooted at s (or 0 if u unreachable);
 *  dist[u] is the shortest path distance from vertex s to vertex u
 *  (or infinity if u unreachable), ts is a trace string and stats is a
 *  statistics object; if g has negative edges, returns [].
 */
export default function sptDf(g, s, trace=0) {
	let link = new Int32Array(g.n+1); let ts = '';
	let dist = new Array(g.n+1).fill(Infinity);
	let h = new FibHeaps(g.n);
	let inheap = new Int8Array(g.n+1).fill(false);
	let heapsize = 0;
	if (trace) ts += g.toString(1);

	dist[s] = 0;
	let root = h.insert(s, s, 0); inheap[s] = true; heapsize++;
	if (trace) ts += 'initial heap: ' + h.toString(2,0,root) + '\n\n' +
					 'selected vertex, edge to parent, ' + 
					 `distance from ${g.x2s(s)}, heap contents\n`;
	while (heapsize > 0) {
		let u; [u, root] = h.deletemin(root);
		inheap[u] = false; heapsize--;
		for (let e = g.firstOutof(u); e; e = g.nextOutof(u, e)) {
			if (g.length(e) < 0) return [];
			let v = g.head(e);
			if (dist[v] > dist[u] + g.length(e)) {
				dist[v] = dist[u] + g.length(e); link[v] = e;
				if (inheap[v]) {
					root = h.changekey(v, root, dist[v]);
				} else {
					root = h.insert(v, root, dist[v]);
					inheap[v] = true; heapsize++;
				}
			}
		}
		if (trace) {
			ts += `${g.x2s(u)} ${link[u] > 0 ? g.e2s(link[u]) : '-'} ` +
				  `${dist[u]} ${heapsize ? h.toString(2,0,root) : '{}'}\n`;
		}
	}
	return [link, dist, ts, h.getStats()];
}
