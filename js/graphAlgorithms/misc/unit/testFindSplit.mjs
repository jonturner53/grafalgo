/** \file testFindSplit.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertFail } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';
import findSplit from '../findSplit.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';

try {
	console.log("testing findSplit");

	let n = 10; let g = new Graph(n);
	g.fromString('{a[f h j] b[g i] c[i j] d[g i j] e[f i]' +
				 'f[a e] g[b d] h[a] i[b c d e] j[a c d]}');

	matches(findSplit(g), '[a e c d b : f g h i j]', 'a1');

	g.fromString('{a[f h j] b[g i] c[i j] d[g i] e[f i]' +
				 'f[a e] g[b d] h[a] i[b c d e] j[a c]}');
	matches(findSplit(g), '[a e c b d : f g h i j]', 'a2');

	g.join(8, 10);
	matches(findSplit(g)==null, true, 'a3');

} catch (e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
