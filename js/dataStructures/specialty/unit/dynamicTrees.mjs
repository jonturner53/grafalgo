/** \file dynamicTrees.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import DynamicTrees from '../DynamicTrees.mjs';
import { AssertFail } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';

try {
	console.log('testing Dynamic Trees');

	let dt = new DynamicTrees();

	dt.fromString('{[c:4(f:2(a:5 b:1))] [e:4(g:3(d:2 i:3(h:2)))]}');
	matches(dt, '{[c:4(f:2(a:5 b:1))] [e:4(g:3(d:2 i:3(h:2)))]}', 'a1');
	matches(dt.toString(0x12),
				'{[a:5]f [b:1]f c:4 [d:2]g e:4 [f:2]c ' +
				'[g:3]e [h:2]i [i:3]g}', 'a2');
	dt.expose(1); dt.expose(9);
	matches(dt, '{[c:4(f:2(a:5 b:1))] [e:4(g:3(d:2 i:3(h:2)))]}', 'a3');
	matches(dt.toString(0x12),
			'{[a:5 f:2 c:4] [b:1]f [d:2]g [h:2]i [i:3 g:3 e:4]}', 'a4');
	dt.addcost(4, 3);
	matches(dt, '{[c:4(f:2(a:5 b:1))] [e:7(g:6(d:5 i:3(h:2)))]}', 'a5');
	matches(dt.toString(0x12),
			'{[a:5 f:2 c:4] [b:1]f [d:5 g:6 e:7] [h:2]i [i:3]g}', 'a6');
	dt.prune(9);
	dt.graft(9,6);
	matches(dt, '{[e:7(g:6(d:5))] [c:4(f:2(a:5 b:1 i:3(h:2)))]}', 'a7');
	matches(dt.toString(0x12),
			'{[a:5]f [b:1]f [d:5 g:6 e:7] [h:2]i [i:3 f:2 c:4]}', 'a8');
	let u = dt.findroot(4);  let [v,c] = dt.findcost(8);
	matches(u, 5, 'a11'); matches(v, 6, 'a12'); matches(c, 2, 'a13');
	matches(dt, '{[c:4(f:2(a:5 b:1 i:3(h:2)))] [e:7(g:6(d:5))]}', 'a14');
	matches(dt.toString(0x12),
			'{[a:5]f [b:1]f [d:5 g:6 e:7] [h:2 i:3 f:2 c:4]}', 'a15');
	matches(dt.toString(0x1e),
			'{[a:5:5]f [b:1:1]f [(d:5:0 g:6:0:1 -) *e:7:5:2 -] ' +
			'[(h:2:0 i:3:0:1 -) *f:2:2 c:4:2]}', 'a16');

} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
