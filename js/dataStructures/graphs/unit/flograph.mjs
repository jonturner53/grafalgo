/** \file flograph.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { AssertFail, EnableAssert as ea } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';
import Flograph from '../Flograph.mjs';
import {randomFlograph} from '../../../graphAlgorithms/misc/RandomGraph.mjs';

try {
	console.log('testing Flograph');

	let g = new Flograph(6, 20);
	matches(g.fromString('{a->[b:4 c:3] b[c:3 d:4] c[e:4] d[f:4] e[f:3] ->f[]}'),
		   true,'a00');
	matches(g.toString(),
		   '{a->[b:4 c:3] b[c:3 d:4] c[e:4] d[f:4] e[f:3] ->f}', 'a0');
	matches(g, '{a->[b:4 c:3] b[c:3 d:4] c[e:4] d[f:4] e[f:3] ->f}', 'a1');
	let e1 = g.findEdge(1, 2); let e2 = g.findEdge(1, 3);
	g.flow(e1, 3);
	matches(g.f(e1, 1), 3, 'a2');
	matches(g.res(e1, 1), 1, 'a3');
	matches(g.f(e1, 2), -3, 'a4');
	matches(g.res(e1, 2), 3, 'a5');
	g.addFlow(e2, 1, 2); g.addFlow(e1, 2, 2);
	matches(g, '{a->[b:4/1 c:3/2] b[c:3 d:4] c[e:4] d[f:4] e[f:3] ->f[]}', 'a6');
	matches(g.totalFlow(), 3, 'a7');
	g.cost(1, 5);
	matches(g, '{a->[b:4@5/1 c:3/2] b[c:3 d:4] c[e:4] d[f:4] e[f:3] ->f}',
			   'a8');
	matches(g.fromString('{a->[b:4@5/1 c:3/2] b[c:3@7 d:1-4@3/2] c[e:4] ' +
						'd[f:2-4/2] e[f:3] ->f[]}'), true, 'a9');
	matches(g,	'{a->[b:4@5/1 c:3/2] b[c:3@7 d:1-4@3/2] c[e:4] ' +
				'd[f:2-4/2] e[f:3] ->f[]}', 'a10');
} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
