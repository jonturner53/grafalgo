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
	console.log('running basic tests');

	let dt = new DynamicTrees();

	dt.fromString('{c:4(f:2(a:5 b:1)) e:4(g:3(d:2 i:3(h:2)))}');
	assert(dt, '{c:4(f:2(a:5 b:1)) e:4(g:3(d:2 i:3(h:2)))}', 'a1');
	assert(dt.toString(1),
				'{ {[c:4] [a:5]->f [b:1]->f [f:2]->c} ' +
				'{[e:4] [d:2]->g [g:3]->e [h:2]->i [i:3]->g} }', 'a2');
	dt.expose(1); dt.expose(9);
	assert(dt, '{c:4(f:2(a:5 b:1)) e:4(g:3(d:2 i:3(h:2)))}', 'a3');
	assert(dt.toString(1),  '{ {[a:5 f:2 c:4] [b:1]->f} ' +
							'{[i:3 g:3 e:4] [d:2]->g [h:2]->i} }', 'a4');
	dt.addcost(4, 3);
	assert(dt, '{c:4(f:2(a:5 b:1)) e:7(g:6(d:5 i:3(h:2)))}', 'a5');
	assert(dt.toString(1),'{ {[a:5 f:2 c:4] [b:1]->f} ' +
							'{[d:5 g:6 e:7] [h:2]->i [i:3]->g} }', 'a6');
	dt.cut(9); dt.link(9,6);
	assert(dt, '{c:4(f:2(a:5 b:1 i:3(h:2))) e:7(g:6(d:5))}', 'a7');
	assert(dt.toString(1),'{ {[a:5 f:2 c:4] [b:1]->f [h:2]->i [i:3]->f} ' +
							'{[d:5 g:6 e:7]} }', 'a8');
	let u = dt.findroot(4);  let [v,c] = dt.findcost(8);
	assert(u, 5, 'a11'); assert(v, 6, 'a12'); assert(c, 2, 'a13');
	assert(dt, '{c:4(f:2(a:5 b:1 i:3(h:2))) e:7(g:6(d:5))}', 'a4');
	assert(dt.toString(1),'{ {[h:2 i:3 f:2 c:4] [a:5]->f [b:1]->f} ' +
							'{[d:5 g:6 e:7]} }', 'a15');

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
