/** @file hpcRandom.mjs
 *
 *  @author Jon Turner
 *  @date 2024
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert} from '../../common/Assert.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import { range, randomInteger, randomPermutation } from '../../common/Random.mjs';

/** Generate a sparse random graph with a hamiltonian cycle/path.
 *  @param n is the number of vertices in the graph
 *  @param m is the number of edges in the graph (at most 2*n*log2(n))
 *  @param s is a source vertex (or 0)
 *  @param t is a destination vertex (or 0)
 *  @return a random graph; if s == 0, the graph contains a hamiltonian cycle,
 *  otherwise it contains a hamiltonian path starting at s and ending at t,
 *  unless t == 0 in which case the endpoint is selected randomly
 */
export default function hpcRandom(n, m, s=0, t=0) {
	assert(s >= 0 && s <= n && t >= 0 && t <= n);
	assert(s && n >= 2 || !s && n >= 3);
	assert((s && m >= n-1 || !s && m >= n) && m <= 2*n*Math.log2(n));
	let g = new Graph(n,m);

	let p = randomPermutation(n);
	if (s) { // hamiltonian path
		// find s and move it to front
		let i;
		for (i = 1; i <= n; i++)
			if (p[i] == s) break;
		p[i] = p[1]; p[1] = s;
		if (t) {
			// find t and move it to end
			for (i = 2; i <= n; i++)
				if (p[i] == t) break;
			p[i] = p[n]; p[n] = t;
		}
	}
	for (let i = 1; i < n; i++) g.join(p[i],p[i+1]);
	if (!s) g.join(p[n],p[1]);

	while (g.m < m) {
		let u = randomInteger(1,n);
		let v = randomInteger(1,n-1);
		if (v >= u) v++;
		if (!g.findEdge(u,v)) g.join(u,v);
	}

	g.scramble();
	return g;
}
