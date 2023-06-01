/** \file testFindSplit.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../../common/Errors.mjs';
import findSplit from '../findSplit.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';

try {
	console.log("testing findSplit");

	let n = 10; let g = new Graph(n);
	g.fromString('{a[f h j] b[g i] c[i j] d[g i j] e[f i]' +
				 'f[a e] g[b d] h[a] i[b c d e] j[a c d]}');

	assert(findSplit(g), '[a e c d b : f g h i j]', 'a1');

	g.fromString('{a[f h j] b[g i] c[i j] d[g i] e[f i]' +
				 'f[a e] g[b d] h[a] i[b c d e] j[a c]}');
	assert(findSplit(g), '[a e c b d : f g h i j]', 'a2');

	g.join(8, 10);
	assert(findSplit(g) == null, 'a3');

} catch (e) {
	if (e instanceof AssertError)
		if (e.message.length > 0)
			console.log(e.name + ': ' + e.message);
		else
			console.error(e.stack);
	else
		throw(e);
}
