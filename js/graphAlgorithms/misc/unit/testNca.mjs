/** \file TestNca.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import nca from '../Nca.mjs';
import Forest from '../../../dataStructures/trees/Forest.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import { AssertFail } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';

try {
	console.log('testing nca');

	let f = new Forest();
	f.fromString('{[a(b(c d) e)] [f(g h i(j k))]}');
	let g = new Graph();
	g.fromString('{b[d e j] c[d e f] g[h j] h[k] j[k]}');
	let ncav = nca(f,g);

	let e = g.findEdge(2,4);   matches(ncav[e], 2, 'a1');
		e = g.findEdge(2,5);   matches(ncav[e], 1, 'a2');
		e = g.findEdge(2,10);  matches(ncav[e], 0, 'a3');
		e = g.findEdge(3,4);   matches(ncav[e], 2, 'a4');
		e = g.findEdge(3,5);   matches(ncav[e], 1, 'a5');
		e = g.findEdge(7,10);  matches(ncav[e], 6, 'a6');
		e = g.findEdge(10,11); matches(ncav[e], 9, 'a7');
} catch(e) {
	if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
    } else if (e instanceof AssertFail) {
        console.error(e.stack);
    } else {
        throw(e);
    }
}

