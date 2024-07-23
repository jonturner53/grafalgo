/** \file pathSet.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { AssertFail } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';
import PathSet from '../PathSet.mjs';

try {
	console.log('testing PathSet');

	let ps = new PathSet();

	matches(ps.fromString('{[a:5 f:2 c:4]g [b:1] [d:2 g:3 e:4]}'), true, 'a0');

	matches(ps, '{[b:1] [a:5 f:2 c:4]g [d:2 g:3 e:4]}', 'a1');
	matches(ps.toString(0xe),
			'{b:1:1 [(a:5:3 f:2:0 -) *c:4:2:2 -]g ' +
			'[(d:2:0 g:3:0:1 -) *e:4:2:2 -]}', 'a2');
	let [r,c] = ps.findpathcost(6);
	matches(r, 6, 'a3'); matches(c, 2, 'a4');
	matches(ps.toString(0xe),
			'{b:1:1 [(d:2:0 g:3:0:1 -) *e:4:2:2 -] [a:5:3 *f:2:2 c:4:2]g}',
			'a5');
	ps.join(5, 2, 6);
	matches(ps, '{[d:2 g:3 e:4 b:1 a:5 f:2 c:4]}', 'a6');
	matches(ps.toString(0xe),
		'{[((d:2:0 g:3:0:1 -) e:4:1:2 -) *b:1:1 (a:5:3 f:2:1 c:4:2)]g}', 'a7');
	ps.findtail(2);
	matches(ps.toString(0xe),
		'{[((((d:2:0 g:3:0:1 -) e:4:1:2 -) b:1:0 a:5:4) f:2:0:1 -) ' +
		'*c:4:1:3 -]g}', 'a8');
	ps.split(5);
	matches(ps, '{[b:1 a:5 f:2 c:4] [e:4] [d:2 g:3]}', 'a9');
	matches(ps.toString(0xe),
		'{[(- b:1:0 (a:5:3 f:2:1 -)) *c:4:1:3 -] e:4:4 [d:2:0 *g:3:2:1 -]}',
		'a10');
	[r, c] = ps.findpathcost(3);
	matches(r, 2, 'a11'); matches(c, 1, 'a12');
	matches(ps.toString(0xe),
		'{[- *b:1:1 ((a:5:3 f:2:0 -) c:4:1:2 -)] e:4:4 [d:2:0 *g:3:2:1 -]}',
		'a13');
	matches(ps.cost(1), 5, 'a14'); matches(ps.mincost(2), 1, 'a15');

} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
