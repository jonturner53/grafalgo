/** \file testDfs.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../../Errors.mjs';
import dfs from '../dfs.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';

try {
	console.log("running basic tests");

	let n = 6; let g = new Graph(n);
	g.fromString("{a[b d e] b[a c f] c[b d f] d[a c e] e[a d] f[b c]}");

	let treeEdges = dfs(g, 1);
	assert(treeEdges.toString(), '1,2,3,4,5,6', 'a1');
	treeEdges = dfs(g, 4);
	assert(treeEdges.toString(), '4,1,2,3,6,5', 'a2');
	treeEdges = dfs(g, 6);
	assert(treeEdges.toString(), '6,2,1,4,3,5', 'a3');

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
