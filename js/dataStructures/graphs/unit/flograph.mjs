/** \file TestFlograph.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError } from '../../../common/Errors.mjs';
import Flograph from '../Flograph.mjs';

try {
	console.log('running basic tests');

	let g = new Flograph(6, 20);
	g.fromString('{a->[b:4:0 c:3:0] b[c:3:0 d:4:0] c[e:4:0] d[f:4:0] ' +
				 'e[f:3:0] ->f[]}');
	assert(g, '{a->[b:4:0 c:3:0] b[c:3:0 d:4:0] c[e:4:0] d[f:4:0] ' +
				'e[f:3:0] ->f[]}', 'a1');
	let e1 = g.findEdge(1, 2); let e2 = g.findEdge(1, 3);
	g.setFlow(e1, 3);
	assert(g.f(e1, 1), 3, 'a2');
	assert(g.res(e1, 1), 1, 'a3');
	assert(g.f(e1, 2), -3, 'a4');
	assert(g.res(e1, 2), 3, 'a5');
	g.addFlow(e2, 1, 2); g.addFlow(e1, 2, 2);
	assert(g, '{a->[b:4:1 c:3:2] b[c:3:0 d:4:0] c[e:4:0] d[f:4:0] ' +
			  'e[f:3:0] ->f[]}', 'a6');
	assert(g.totalFlow(), 3, 'a7');

	g.setCost(1, 5);
	assert(g, '{a->[b:5:4:1 c:0:3:2] b[c:0:3:0 d:0:4:0] c[e:0:4:0] ' +
			  'd[f:0:4:0] e[f:0:3:0] ->f[]}', 'a6');

	console.log('passed tests');
} catch(e) {
    if (e instanceof AssertError) {
		if (e.message.length != 0)
        	console.error(`${e.name}: ${e.message}`);
		else
			console.error(e.stack);
    } else {
        console.error(`${e.message}`);
		console.error(e.stack);
	}
}