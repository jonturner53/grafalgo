/** \file TestGraph_w.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError } from '../../../Errors.mjs';
import Adt from '../../Adt.mjs';
import Graph_w from '../Graph_w.mjs';

try {
	console.log('running basic tests');

	let n = 8; let nMax = 12; let mMax = 30;
	let g = new Graph_w(n, nMax, mMax);

	g.join(1, 4); g.join(1, 3); g.join(2, 4); g.join(3, 5);
	g.setWeight(g.findEdge(1,4), 7);
	g.setWeight(g.findEdge(3,5), 8);
	assert(g, '{a[d:7 c:0] b[d:0] c[a:0 e:8] ' + 
			  'd[a:7 b:0] e[c:8] f[] g[] h[]}', 'a1');
	assert(g.toString(1),
			  '{a[d:7:1 c:0:2] b[d:0:3] c[a:0:2 e:8:4] ' + 
			  'd[a:7:1 b:0:3] e[c:8:4] f[] g[] h[]}', 'a2');

	g.reset(4, 10, 10);
	g.fromString('{a[d:1 b:2] b[a:2 c:3] c[b:3 d:4] d[a:1 c:4]}');
	assert(g, '{a[b:2 d:1] b[a:2 c:3] c[b:3 d:4] d[a:1 c:4]}', 'a3');

	console.log('tests passed');
} catch(e) {
    if (e instanceof AssertError) {
		if (e.message.length > 0)
        	console.log(e.name + ': ' + e.message);
		else
			console.error(e.stack);
    } else {
        throw(e);
	}
}
