/** @file hpcVerify.mjs
 *
 *  @author Jon Turner
 *  @date 2024
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert} from '../../common/Assert.mjs';

/** Verify a hamiltonian path or cycle.
 *  @param g is a Graph object
 *  @param path is a hamiltonian path or cycle in the form of an array of edges
 *  @param s is a source vertex (or 0 in case of a cycle)
 *  @param t is a termination vertex (or 0 if any final vertex is acceptable)
 *  @return a string which is empty if the path/cycle is correct,
 *  otherwise an error string
 */
export default function hpcVerify(g, s=0, t=0, path) {
	if (s < 0 || s > g.n) return('invalid source');
	if (t < 0 || t > g.n) return('invalid destination');
	if (s == 0) t = 0;

	if (!path) return 'no path/cycle found';

	for (let i = 0; i < g.n; i++) {
		let e = path[i];
		if (!g.validEdge(e) && (i < g.n-1 || !s))
			return `invalid or missing edge ${e} at path[${i}]`;
	}
	let e0 = path[0]; let e1 = path[1];
	let f0 = path[g.n-1]; let f1 = path[g.n-2];
	let u0 = g.left(e0);
	if (g.left(e1) == u0 || g.right(e1) == u0)
		u0 = g.mate(u0,e0);
	if (s && g.left(e0) != s && g.right(e0) != s) {
		return `initial edge ${g.e2s(e0)} does not include ${g.x2s(s)}`;
	} else if (s && t && g.left(f1) != t && g.right(f1) != t) {
		return `final edge ${g.e2s(f1)} does not include ${g.x2s(t)}`;
	} else if (!s) {
		if (g.left(f0) != u0 && g.right(f0) != u0)
			return `final edge ${g.e2s(f0)} does not include ${g.x2s(u0)}`;
		let x = g.left(e0); let y = g.right(e0);
		let e1 = path[1];
		u0 = (g.left(e1) != x && g.right(e1) != x ? x : y);
	}

	let mark = new Int8Array(g.n+1); let u = u0; mark[u] = 1;
	for (let i = 0; i < g.n-1; i++) {
		let e = path[i];
		if (g.left(e) != u && g.right(e) != u)
			return `edge ${g.e2s(e)} at path[${i}] missing ${g.x2s(u)}`;
		u = g.mate(u,e);
		if (mark[u])
			return `path edge ${g.e2s(e)} repeats vertex ${g.x2s(u)}`;
		mark[u] = 1;
	}
	return '';
}
