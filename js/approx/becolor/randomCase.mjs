/** \file randomCase.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import { randomSample } from '../../common/Random.mjs';
import { randomRegularBigraph }
		from '../../graphAlgorithms/misc/RandomGraph.mjs';

/** Generate a random regular test case.
 *  @param n is the number of vertices in each block of the bipartition
 *  @param d is the vertex degree
 *  @param speedup specifies speedup factor for use in switching
 *  applications; color bounds are selected to emulate packet arrival
 *  times separated by intervals larger than 1
 *  @param extra is the number of extra bound values (in addition to
 *  the minimum of d) from which edge bounds are selected
 *  @return a graph with random bounds
 */
export default function randomCase(n, d, speedup=1, extra=0) {
	let g = randomRegularBigraph(n,d); g.addBounds();
	for (let u = 1; u <= n; u++) {
		let bu = randomSample(d+extra, d); let i = 1;
		for (let e = g.firstAt(u); e; e = g.nextAt(u,e))
			g.bound(e, Math.ceil(1+speedup*(bu[i++]-1)));
	}
	return g;
}
