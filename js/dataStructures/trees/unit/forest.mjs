/** \file forest.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError } from '../../../common/Errors.mjs';
import Forest from '../Forest.mjs';

try {
	console.log('running basic tests');

	let f = new Forest();
	assert(f.fromString('{[a(b(c d) e)] [f(g h i(j k))]}'), 'a0');
	assert(f, '{[a(b(c d) e)] [f(g h i(j k))]}', 'a1');
	assert(f.firstChild(2), 3, 'a2');
	assert(f.firstChild(3), 0, 'a3');
	assert(f.nextSibling(2), 5, 'a4');
	f.cut(2); f.link(2,8);
	assert(f, '{[a(e)] [f(g h(b(c d)) i(j k))]}', 'a5');
	f.rotate(7,8);
	assert(f, '{[a(e)] [f(h(b(c d)) i(j k) g)]}', 'a6');
	f.expand(14);
	f.link(13,14);
	assert(f, '{[a(e)] [f(h(b(c d)) i(j k) g)] [n(m)]}', 'a7');
	f.joinGroups(1,14); f.joinGroups(1,12);
	assert(f, '{[a(e) n(m) l] [f(h(b(c d)) i(j k) g)]}', 'a8');

	f.clear();
	let prop = new Array(7);
	f.fromString('{[a:1(b:2(c:3 d:4) e:5)] [f:6]}',
						(u,sc) => {
							if (!sc.verify(':')) {
								prop[u] = 0; return true;
							}
							let p = sc.nextNumber();
							if (Number.isNaN(p)) return false;
							prop[u] = p;
							return true;
						});
	assert(prop[1], 1, 'd1'); assert(prop[2], 2, 'd2');
	assert(prop[3], 3, 'd3'); assert(prop[4], 4, 'd4');
	assert(prop[5], 5, 'd5'); assert(prop[6], 6, 'd6');
	assert(f, '{[a(b(c d) e)] [f]}', 'd7');

	console.log('passed tests');
} catch(e) {
    if (e instanceof AssertError) {
        console.error(`${e.name}: ${e.message}`);
		if (e.message.length == 0 || e.message.startsWith('fatal:'))
			console.error(e.stack);
    } else {
        console.error(`${e.message}`);
		console.error(e.stack);
	}
}
