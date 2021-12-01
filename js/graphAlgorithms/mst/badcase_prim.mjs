/** @file badcase_prim.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Graph from '../../dataStructures/graphs/Graph.mjs';

/** Generate a badcase graph for Prim's algorithm.
 *  @param n is the number of vertices
 *  @param m is the number of edges
 *  @return a Graph object that defines a badcase graph for Prim
 */
export default function badcase_prim(n, m=n*(n-1)/2) {
	let g = new Graph(n, m);
	let skip = n*(n-1)/(2*m); let k = 0; let wt = m;
	for (let u = 1; u <= n; u++) {
		for (let v = n; v > u; v--) {
			if (k++ % skip >= 1) continue;
			if (wt > 0) {
				let e = g.join(u, v); g.setWeight(e, wt--);
			}
		}
	}
	return g;
}
