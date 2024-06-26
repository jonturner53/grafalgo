/** @file hpcRandom.mjs
 *
 *  @author Jon Turner
 *  @date 2024
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert, EnableAssert as ea} from '../../common/Assert.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import { range,randomPermutation, randomInteger} from '../../common/Random.mjs';

/** Generate a sparse random graph with a hamiltonian cycle/path.
 *  @param n is the number of vertices in the graph
 *  @param m is the number of edges in the graph (at most 2*n*log2(n))
 *  @param s is a source vertex (or 0)
 *  @param t is a destination vertex (or 0)
 *  @return a random graph; if s == 0, the graph contains a hamiltonian cycle,
 *  otherwise it contains a hamiltonian path starting at s and ending at t,
 *  unless t == 0 in which case the endpoint is selected randomly
 */
export default function hpcRandom(n, d, s=0, t=0) {
	ea && assert(s >= 0 && s <= n && t >= 0 && t <= n &&
				 (s || !t) && (s != t || !t));
	ea && assert(s && n >= 2 || !s && n >= 3);
	ea && assert(d >= 2 && d <= 5*Math.log(n) && d <= n-1);

	let m = ~~(d*n/2); let g = new Graph(n,m);

	let p = new range(n);
	if (s) {
		[p[1],p[s]] = [p[s],p[1]];
		if (t) [p[n],p[t]] = [p[t],p[n]];
	}
	for (let i = 1; i < n; i++) g.join(p[i],p[i+1]);
	if (!s && n > 2) g.join(p[n],p[1]);

	while (g.m < m) {
		let u = randomInteger(1,n);
		let v = randomInteger(1,n-1); if (v >= u) v++;
		if (u == s && v == t || u == t && v == s) continue;
		if (!g.findEdge(u,v)) g.join(u,v);
	}
	let fp = new Set(s && t ? [s,t] : (s ? [s] : []));
	g.scramble(new Set(fp));
	return g;
}
