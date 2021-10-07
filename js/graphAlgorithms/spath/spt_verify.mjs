/** @file mst_verify.js
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../common/Errors.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Digraph_l from '../../dataStructures/graphs/Digraph_l.mjs';

/** Check the correctness of an spt.
 *  @param g is a digraph with edge lengths
 *  @param s is a source vertex in g
 *  @param pedge is an array for which pedge[u] is the edge into u in an spt
 *  @param dist is an array, where dist[u] is the shortest path distance
 *  from s to u.
 *  @return 'ok' if tree is a valid mst, otherwise return an error message
 */
export default function spt_verify(g, s, pedge, dist) {
	if (!g.validVertex(s))
		return `spt_verify: invalid source vertex ${s}`;
	if (pedge.length != g.n+1)
		return `spt_verify: pedge length (${pedge.length}) does not match g`;
	if (dist.length != g.n+1)
		return `spt_verify: dist length (${dist.length}) does not match g`;
	if (dist[s] != 0)
		return `spt_verify: dist[source] is not zero`;
	// verify that pedge defines a tree rooted at s and that distances match
	let mark = new Array(g.n).fill(false); mark[s] = true;
	for (let u = 1; u <= g.n; u++) {
		if (!mark[u] && pedge[u] != 0) {
			mark[u] = true;
			let v = u;
			for (let e = pedge[v]; e != 0; e = pedge[v]) {
				if (!g.validEdge(e))
					return `spt_verify: invalid edge ${e} in pedge`;
				if (v != g.head(e))
					return `spt_verify: pedge[${v}] is an outgoing edge`;
				let w = g.tail(e);
				if (w == u)
					return `spt_verify: cycle in pedge at ${u}`
				if (dist[w] + g.length(e) != dist[v])
					return `spt_verify: dist[${v}] does not match dist[${w}]`;
				if (mark[w]) break;
				mark[w] = true;
				v = w;
			}
			if (pedge[v] == 0 && v != s)
				return `spt_verify: tree path from ${u} does not lead to root`;
		}
	}

	// make sure everything reachable in g is reachable in t
	let mark2 = new Array(g.n+1).fill(false);
    let q = new List(g.n); q.enq(s); mark2[s] = true;
    while (!q.empty()) {
        let u = q.deq();
		if (!mark[u])
			return `spt_verify: reachable vertex ${u} not in tree`;
		for (let e = g.firstOut(u); e != 0; e = g.nextOut(u, e)) {
			let v = g.head(e);
			if (!mark2[v]) {
				q.enq(v); mark2[v] = true;
			}
		}
	}

	// verify all distances in dist
	for (let e = g.first(); e != 0; e = g.next(e)) {
		let u = g.tail(e); let v = g.head(e);
		if (dist[u] + g.length(e) < dist[v]) 
			return `spt_verify: ${g.edge2string(e)} violates distance ` +
				   `condition`;
	}
	return 'ok';
}
