/** \file TestDigraph_l.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError } from '../../../Errors.mjs';
import Adt from '../../Adt.mjs';
import Digraph_l from '../Digraph_l.mjs';

try {
	console.log('running basic tests');

	let n = 8; let nMax = 12; let mMax = 30;
	let g = new Digraph_l(n, nMax, mMax);

	g.join(1, 4); g.join(1, 3); g.join(2, 4); g.join(3, 5);
	g.setLength(g.findEdge(1,4), 7);
	g.setLength(g.findEdge(3,5), 8);
	assert(g, '{a[d:7 c:0] b[d:0] c[e:8] ' + 
			  'd[] e[] f[] g[] h[]}', 'a1');
	assert(g.toString(true),
			  '{a[d:7:1 c:0:2] b[d:0:3] c[e:8:4] ' + 
			  'd[] e[] f[] g[] h[]}', 'a2');

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
