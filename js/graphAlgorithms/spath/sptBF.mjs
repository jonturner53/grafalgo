/** @file sptBF.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';

/** Compute shortest path tree of a graph using Bellman-Ford algorithm.
 *  @param g is a digraph with edge lengths, some possibly negative
 *  @param s is a "source vertex" in g; if 0, distances are computed
 *  from a dummy source vertex with a zero-length edge to every real vertex
 *  @param trace controls output of information about the internal  
 *  state of the computation; larger values produce more information
 *  @return a tuple [error, pedge, dist, ts, stats] where error is an empty
 *  string on success and an error string on failure, pedge[u] is the edge from
 *  the parent of u to u in the spt rooted at s (or 0 if u unreachable);
 *  dist[u] is the shortest path distance from vertex s to vertex u
 *  (or infinity if u unreachable), ts is a trace string and stats is a
 *  statistics object.
 */
export default function sptBF(g, s, trace=0) {
	let pedge = new Array(g.n+1).fill(0); let ts = ''; let err = '';
	let dist = new Array(g.n+1).fill(Number.POSITIVE_INFINITY);

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
		ts += g.toString(0,1) + 'initial queue: ' + q + '\n\n' +
			  'selected vertex, distance, edge to parent, queue, ' +
			  'pass count\n';
	}
	while (!q.empty()) {
		let u = q.pop();
		for (let e = g.firstOut(u); e != 0; e = g.nextOut(u,e)) {
			let v = g.head(e); steps++;
			if (dist[u] + g.length(e) < dist[v]) {
				dist[v] = dist[u] + g.length(e); pedge[v] = e;
				if (!q.contains(v)) q.enq(v);
			}
		}
		if (u == last && !q.empty()) { pass++; last = q.last(); }
		if (trace) {
			ts += g.index2string(u) + ' ' +
				  (dist[u] != Number.POSITVE_INFINITY ? dist[u] : '-') + ' ' +
				  (pedge[u] != 0 ? g.edge2string(pedge[u]) : '-') + ' ' +
				  q + ' ' + pass + '\n';
		}
		if (pass == g.n) 
			return ['Error: negative cycle', pedge, dist, ts,
				    { 'passCount': pass, 'stepCount': steps }]
	}
	return ['', pedge, dist, ts, { 'passCount': pass, 'stepCount': steps }];
}
