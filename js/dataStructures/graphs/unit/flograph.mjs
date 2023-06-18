/** \file flograph.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError } from '../../../common/Errors.mjs';
import Flograph from '../Flograph.mjs';
import {randomFlograph} from '../../../graphAlgorithms/misc/RandomGraph.mjs';

try {
	console.log('testing Flograph');

	let g = new Flograph(6, 20);
	assert(g.fromString('{a->[b:4 c:3] b[c:3 d:4] c[e:4] d[f:4] e[f:3] ->f[]}'),
		   'a00');
	assert(g.toString(),
		   '{a->[b:4 c:3] b[c:3 d:4] c[e:4] d[f:4] e[f:3] ->f}', 'a0');
	assert(g, '{a->[b:4 c:3] b[c:3 d:4] c[e:4] d[f:4] e[f:3] ->f}', 'a1');
	let e1 = g.findEdge(1, 2); let e2 = g.findEdge(1, 3);
	g.flow(e1, 3);
	assert(g.f(e1, 1), 3, 'a2');
	assert(g.res(e1, 1), 1, 'a3');
	assert(g.f(e1, 2), -3, 'a4');
	assert(g.res(e1, 2), 3, 'a5');
	g.addFlow(e2, 1, 2); g.addFlow(e1, 2, 2);
	assert(g, '{a->[b:4/1 c:3/2] b[c:3 d:4] c[e:4] d[f:4] e[f:3] ->f[]}', 'a6');
	assert(g.totalFlow(), 3, 'a7');
	g.cost(1, 5);
	assert(g, '{a->[b:4@5/1 c:3/2] b[c:3 d:4] c[e:4] d[f:4] e[f:3] ->f}',
			   'a8');
	assert(g.fromString('{a->[b:4@5/1 c:3/2] b[c:3@7 d:1-4@3/2] c[e:4] ' +
						'd[f:2-4/2] e[f:3] ->f[]}'), 'a9');
	assert(g,	'{a->[b:4@5/1 c:3/2] b[c:3@7 d:1-4@3/2] c[e:4] ' +
				'd[f:2-4/2] e[f:3] ->f[]}', 'a10');
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
