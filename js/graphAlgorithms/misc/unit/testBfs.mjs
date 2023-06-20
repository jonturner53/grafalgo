/** \file testBfs.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertFail } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';
import bfs from '../bfs.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';

try {
	console.log("testing bfs");

	let n = 6; let g = new Graph(n);
	g.fromString("{a[b d e] b[a c f] c[b d f] d[a c e] e[a d] f[b c]}");

	let vlist = bfs(g, 1);
	matches(g.ilist2string(vlist), '[a b d e c f]', 'a1');
	vlist = bfs(g, 4);
	matches(g.ilist2string(vlist), '[d a c e b f]', 'a2');
	vlist = bfs(g, 6);
	matches(g.ilist2string(vlist), '[f b c a d e]', 'a3');

} catch (e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
