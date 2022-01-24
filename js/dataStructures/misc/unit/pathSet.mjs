/** \file pathSet.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import PathSet from '../PathSet.mjs';
import { assert, AssertError } from '../../../common/Errors.mjs';

try {
	console.log('running basic tests');

	let ps = new PathSet();

	ps.fromString('{[a:5 f:2 c:4] [b:1]->g [d:2 g:3 e:4]}');
	assert(ps, '{[b:1]->g [a:5 f:2 c:4] [d:2 g:3 e:4]}', 'a1');
	assert(ps.toString(1),  '{[b.1:0]->g [(a.3:0 f:0:0) c:2:2] ' +
							'[(d.0:0 g:0:1) e:2:2]}', 'a2');
	let [r,c] = ps.findpathcost(3);
	assert(r, 6, 'a3'); assert(c, 2, 'a4');
	assert(ps.toString(1),  '{[b.1:0]->g [(d.0:0 g:0:1) e:2:2] ' +
							'[a.3:0 f:2:0 c.2:0]}', 'a5');
	ps.join(5, 2, 6);
	assert(ps, '{[d:2 g:3 e:4 b:1 a:5 f:2 c:4]}', 'a6');
	assert(ps.toString(1),  '{[((d.0:0 g:0:1) e:1:2) b:1:0 ' +
							'(a.3:0 f:1:0 c.2:0)]}', 'a7');
	ps.findtail(2);
	assert(ps.toString(1),  '{[((((d.0:0 g:0:1) e:1:2) b:0:0 a.4:0) ' +
							'f:0:1) c:1:3]}', 'a8');
	ps.split(5);
	assert(ps, '{[b:1 a:5 f:2 c:4] [e:4] [d:2 g:3]}', 'a9');
	assert(ps.toString(1),  '{[(b:0:0 (a.3:0 f:1:0)) c:1:3] [e.4:0] ' +
							'[d.0:0 g:2:1]}', 'a10');
	[r, c] = ps.findpathcost(3);
	assert(r, 2, 'a11'); assert(c, 1, 'a12');
	assert(ps.toString(1),  '{[b:1:0 ((a.3:0 f:0:0) c:1:2)] [e.4:0] ' +
							'[d.0:0 g:2:1]}', 'a13');
	assert(ps.cost(1), 5, 'a14'); assert(ps.mincost(6), 2, 'a15');

	console.log('passed tests');
} catch(e) {
    if (e instanceof AssertError)
		if (e.message.length > 0)
        	console.log(e.name + ': ' + e.message);
		else
			console.error(e.stack);
    else
        throw(e);
}
