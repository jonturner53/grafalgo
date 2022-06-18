/** @file sptBM.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../common/Errors.mjs';
import List from '../../dataStructures/basic/List.mjs';

/** Compute shortest path tree of a graph using Bellman-Moore algorithm.
 *  @param g is a digraph with edge lengths, some possibly negative
 *  @param s is a "source vertex" in g; if 0, distances are computed
 *  from a dummy source vertex with a zero-length edge to every real vertex
 *  @param trace controls output of information about the internal  
 *  state of the computation; larger values produce more information
 *  @return a tuple [error, link, dist, ts, stats] where error is an empty
 *  string on success and an error string on failure, link[u] is the edge from
 *  the parent of u to u in the spt rooted at s (or 0 if u unreachable);
 *  dist[u] is the shortest path distance from vertex s to vertex u
 *  (or infinity if u unreachable), ts is a trace string and stats is a
 *  statistics object.
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
		ts += g.toString(0,1) + 'initial queue: ' + q + '\n\n' +
			  'selected vertex, distance, edge to parent, queue, ' +
			  'pass count\n';
	}
	while (!q.empty()) {
		let u = q.pop();
		for (let e = g.firstOut(u); e != 0; e = g.nextOut(u,e)) {
			let v = g.head(e); steps++;
			if (dist[u] + g.length(e) < dist[v]) {
				dist[v] = dist[u] + g.length(e); link[v] = e;
				if (!q.contains(v)) q.enq(v);
			}
		}
		if (u == last && !q.empty()) { pass++; last = q.last(); }
		if (trace) {
			ts += g.index2string(u) + ' ' +
				  (dist[u] != Infinity ? dist[u] : '-') + ' ' +
				  (link[u] != 0 ? g.edge2string(link[u]) : '-') + ' ' +
				  q + ' ' + pass + '\n';
		}
		assert(pass < g.n, 'Error: negative cycle');
	}
	return [link, dist, ts, { 'passCount': pass, 'stepCount': steps }];
}
