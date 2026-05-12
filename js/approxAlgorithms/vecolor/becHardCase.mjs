/** \file becHardCase.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import { lowerBounds, upperBounds } from './becCommon.mjs';

/** Generate a hard test case.
 *  @param n is the number of inputs
 *  @param speedup is used in applications to crossbar scheduling to specify
 *  the speedup ratio of the switch relative to the external links
 *  @return a graph with floors, together with an array of lower bounds
 *  on the optimal solution value and a second array of upper bounds
 */
export default function becHardCase(n,speedup=1) {
	let g = new Graph(3*n-1, n*n, 'floor', 0);
	g.setBipartition(n);
	for (let u = 1; u <= n; u++) {
		for (let i = 1; i <= u; i++) {
			let e = g.join(u, n+i);
			g.floor(e, Math.ceil(1+(speedup*(i-1))));
		}
		for (let i = u+1; i <= n; i++) {
			let e = g.join(u, 2*n+u); g.floor(e, Math.ceil(1+(speedup*(i-1))));
		}
	}
	return [g, lowerBounds(g), [n+Math.ceil((n-1)/3),...upperBounds(g)]];
}
