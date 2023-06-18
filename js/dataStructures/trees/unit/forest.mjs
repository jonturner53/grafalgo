/** \file forest.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { AssertFail } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';
import Forest from '../Forest.mjs';

try {
	console.log('testing Forest');

	let f = new Forest();
	matches(f.fromString('{[a(b(c d) e)] [f(g h i(j k))]}'), true, 'a0');
	matches(f, '{[a(b(c d) e)] [f(g h i(j k))]}', 'a1');
	matches(f.firstChild(2), 3, 'a2');
	matches(f.firstChild(3), 0, 'a3');
	matches(f.nextSibling(2), 5, 'a4');
	f.cut(2); f.link(2,8);
	matches(f, '{[a(e)] [f(g h(b(c d)) i(j k))]}', 'a5');
	f.rotate(7,8);
	matches(f, '{[a(e)] [f(h(b(c d)) i(j k) g)]}', 'a6');
	f.expand(14);
	f.link(13,14);
	matches(f, '{[a(e)] [f(h(b(c d)) i(j k) g)] [n(m)]}', 'a7');
	f.joinGroups(1,14); f.joinGroups(1,12);
	matches(f, '{[a(e) n(m) l] [f(h(b(c d)) i(j k) g)]}', 'a8');

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
	matches(prop[1], 1, 'd1'); matches(prop[2], 2, 'd2');
	matches(prop[3], 3, 'd3'); matches(prop[4], 4, 'd4');
	matches(prop[5], 5, 'd5'); matches(prop[6], 6, 'd6');
	matches(f, '{[a(b(c d) e)] [f]}', 'd7');

} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
