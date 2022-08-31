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
	f.fromString('{a[b[c d] e] f[g h i[j k]]}');
	assert(f, '{a[b[c d] e] f[g h i[j k]]}', 'a1');
	assert(f.firstChild(2), 3, 'a2');
	assert(f.firstChild(3), 0, 'a3');
	assert(f.nextSibling(2), 5, 'a4');
	f.cut(2); f.link(2,8);
	assert(f, '{a[e] f[g h[b[c d]] i[j k]]}', 'a5');
	f.rotate(6,10);
	assert(f, '{a[e] f[h[b[c d]] i[j k] g]}', 'a6');
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
