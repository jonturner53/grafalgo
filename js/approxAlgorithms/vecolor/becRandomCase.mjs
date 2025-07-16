/** \file becRandomCase.mjs
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
 *  @param maxBound is the largest color bound (must be >= d)
 *  @param speedup specifies speedup factor for use in switching
 *  applications; color bounds are selected to emulate packet arrival
 *  times separated by intervals larger than 1
 *  @return a graph with random bounds

We could seed the graph with a coloring of specified color count
by generating a series of matchings and then for edges in
matching i, generate bounds in [1,i]. Here, we assing distinct
bounds at each input, but do not attempt to make bounds consistent
with a solution.

We could also allow asymmetry in the bipartition.

We could also modify the bounded edge group coloring case so
that bounds are assigned randomly at each input.

For bounded case, it would be nice to test the same graph with
bounds and without. Add a method to remove bounds and maybe
another to replace them with random bounds not connected to
a seeded solution.

Maybe use different terminology. When there is a seed we're defining
an upper bound on the optimum solution value. The maximum bound need
be constrained by this.

 */
export default function becRandomCase(n, d, maxBound=d, speedup=1) {
	let g = randomRegularBigraph(n,d); g.hasBounds = 1;
	for (let u = 1; u <= n; u++) {
		let bu = randomSample(maxBound, d); let i = 1;
		for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
			g.bound(e, Math.ceil(1+speedup*(bu[i++]-1)));
		}
	}
	return g;
}
