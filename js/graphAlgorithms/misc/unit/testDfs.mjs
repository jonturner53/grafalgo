/** \file testDfs.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../../common/Errors.mjs';
import dfs from '../dfs.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';

try {
	console.log("running basic tests");

	let n = 6; let g = new Graph(n);
	g.fromString("{a[b d e] b[a c f] c[b d f] d[a c e] e[a d] f[b c]}");

	let vlist = dfs(g, 1);
	assert(g.ilist2string(vlist), '[a b c d e f]', 'a1');
	vlist = dfs(g, 4);
	assert(g.ilist2string(vlist), '[d a b c f e]', 'a2');
	vlist = dfs(g, 6);
	assert(g.ilist2string(vlist), '[f b a d c e]', 'a3');

	console.log('passed tests');
} catch (e) {
	if (e instanceof AssertError)
		if (e.message.length > 0)
			console.log(e.name + ': ' + e.message);
		else
			console.error(e.stack);
	else
		throw(e);
}
