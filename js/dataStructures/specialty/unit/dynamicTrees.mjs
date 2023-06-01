/** \file dynamicTrees.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import DynamicTrees from '../DynamicTrees.mjs';
import { assert, AssertError } from '../../../common/Errors.mjs';

try {
	console.log('Dynamic Trees');

	let dt = new DynamicTrees();

	dt.fromString('{[c:4(f:2(a:5 b:1))] [e:4(g:3(d:2 i:3(h:2)))]}');
	assert(dt, '{[c:4(f:2(a:5 b:1))] [e:4(g:3(d:2 i:3(h:2)))]}', 'a1');
	assert(dt.toString(0x12),
				'{f[a:5] f[b:1] [c:4] g[d:2] [e:4] c[f:2] ' +
				 'e[g:3] i[h:2] g[i:3]}', 'a2');
	dt.expose(1); dt.expose(9);
	assert(dt, '{[c:4(f:2(a:5 b:1))] [e:4(g:3(d:2 i:3(h:2)))]}', 'a3');
	assert(dt.toString(0x12),
			'{f[b:1] [a:5 f:2 *c:4] g[d:2] [i:3 g:3 *e:4] i[h:2]}', 'a4');
	dt.addcost(4, 3);
	assert(dt, '{[c:4(f:2(a:5 b:1))] [e:7(g:6(d:5 i:3(h:2)))]}', 'a5');
	assert(dt.toString(0x12),
			'{f[b:1] [a:5 f:2 *c:4] [d:5 *g:6 e:7] i[h:2] g[i:3]}', 'a6');
	dt.prune(9);
	dt.graft(9,6);
	assert(dt, '{[e:7(g:6(d:5))] [c:4(f:2(a:5 b:1 i:3(h:2)))]}', 'a7');
	assert(dt.toString(0x12),
			'{f[a:5] f[b:1] [d:5 *g:6 e:7] i[h:2] [*i:3 f:2 c:4]}', 'a8');
	let u = dt.findroot(4);  let [v,c] = dt.findcost(8);
	assert(u, 5, 'a11'); assert(v, 6, 'a12'); assert(c, 2, 'a13');
	assert(dt, '{[c:4(f:2(a:5 b:1 i:3(h:2)))] [e:7(g:6(d:5))]}', 'a14');
	assert(dt.toString(0x12),
			'{f[a:5] f[b:1] [d:5 g:6 *e:7] [h:2 i:3 *f:2 c:4]}', 'a15');
	assert(dt.toString(0x1e),
			'{f[a:5:5:0] f[b:1:1:0] [(d:5:0:0 g:6:0:1 -) *e:7:5:2 -] ' +
			'[(h:2:0:0 i:3:0:1 -) *f:2:2:0 c:4:2:0]}', 'a16');

} catch(e) {
    if (e instanceof AssertError)
		if (e.message.length > 0)
        	console.log(e.name + ': ' + e.message);
		else
			console.error(e.stack);
    else
        throw(e);
}
