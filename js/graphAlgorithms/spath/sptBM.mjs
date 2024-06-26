/** @file sptBM.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';

/** Compute shortest path tree of a graph using Bellman-Moore algorithm.
 *  @param g is a digraph with edge lengths, some possibly negative
 *  @param s is a "source vertex" in g; if 0, distances are computed
 *  from a dummy source vertex with a zero-length edge to every real vertex
 *  @param trace controls output of information about the internal  
 *  state of the computation; larger values produce more information
 *  @return a tuple [link, dist, ts, stats] where link[u] is the edge from
 *  the parent of u to u in the spt rooted at s (or 0 if u unreachable);
 *  dist[u] is the shortest path distance from vertex s to vertex u
 *  (or infinity if u unreachable), ts is a trace string and stats is a
 *  statistics object; if g has a negative cycle [] is returned
 */
export default function sptBM(g, s, trace=0) {
	let link = new Int32Array(g.n+1); let ts = ''; let err = '';
	let dist = new Array(g.n+1).fill(Infinity);

	let q = new List(g.n);
	if (s != 0) {
		q.enq(s); dist[s] = 0;
	} else {
		for (let u = 1; u <= g.n; u++) {
			q.enq(u); dist[u] = 0;
		}
	}
	let pass = 0; let last = q.last(); let steps = 0;
	if (trace) {
		ts += g.toString(1) + 'initial queue: ' + q + '\n\n' +
			  'selected vertex, distance, edge to parent, queue, ' +
			  'pass count\n';
	}
	while (!q.empty()) {
		let u = q.deq();
		for (let e = g.firstOutof(u); e; e = g.nextOutof(u,e)) {
			let v = g.head(e); steps++;
			if (dist[v] > dist[u] + g.length(e)) {
				dist[v] = dist[u] + g.length(e); link[v] = e;
				if (!q.contains(v)) q.enq(v);
			}
		}
		if (u == last && !q.empty()) { pass++; last = q.last(); }
		if (trace) {
			ts += g.x2s(u) + ' ' +
				  (dist[u] != Infinity ? dist[u] : '-') + ' ' +
				  (link[u] != 0 ? g.e2s(link[u]) : '-') + ' ' +
				  q + ' ' + pass + '\n';
		}
		if (pass >= g.n) return [];
	}
	return [link, dist, ts, { 'passCount': pass, 'stepCount': steps }];
}
