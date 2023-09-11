/** \file becHardCase.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';

/** Generate a hard test case.
 *  @param n is the number of inputs
 *  @param speedup is used in applications to crossbar scheduling to specify
 *  the speedup ratio of the switch relative to the external links
 *  @return a graph with bounds
 */
export default function becHardCase(n,speedup=1) {
	let g = new Graph(3*n-1,n*n); g.addBounds();
	for (let u = 1; u <= n; u++) {
		for (let i = 1; i <= u; i++) {
			let e = g.join(u, n+i);
			g.bound(e, Math.ceil(1+(speedup*(i-1))));
		}
		for (let i = u+1; i <= n; i++) {
			let e = g.join(u, 2*n+u); g.bound(e, Math.ceil(1+(speedup*(i-1))));
		}
	}
	return g;
}
