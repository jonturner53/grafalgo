/** \file testBfs.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../../Errors.mjs';
import bfs from '../bfs.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';

try {
	console.log("running basic tests");

	let n = 6; let g = new Graph(n);
	g.fromString("{a[b d e] b[a c f] c[b d f] d[a c e] e[a d] f[b c]}");

	let treeEdges = bfs(g, 1);
	assert(treeEdges.toString(), '1,2,4,5,3,6', 'a1');
	treeEdges = bfs(g, 4);
	assert(treeEdges.toString(), '4,1,3,5,2,6', 'a2');
	treeEdges = bfs(g, 6);
	assert(treeEdges.toString(), '6,2,3,1,4,5', 'a3');

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
