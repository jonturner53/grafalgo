/** @file testDsets.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Scanner from '../Scanner.mjs';
import { assert, AssertError } from '../../../Errors.mjs';
import Dsets from '../Dsets.mjs';

try {
	console.log("running basic tests");

	let n = 10; let ds = new Dsets(n);
	assert(ds, '{}', "a1");
	ds.link(1, 3);
	assert(ds, "{{a c}}", "a2");
	ds.link(4, 5); ds.link(2, 4);
	assert(ds, "{{a c} {d b e}}", "a3");
	ds.link(6, 7); ds.link(8, 9); ds.link(8, 10);
	assert(ds, "{{a c} {d b e} {f g} {h i j}}", "a4");
	assert(ds.toString(true),'{a:1(c) d:1(b e) f:1(g) h:1(i j)}', 'a5');
	ds.link(1, 4); ds.link(6, 8);
	assert(ds, "{{a b c d e} {f g h i j}}", "a6");
	ds.link(1, 6);
	assert(ds, "{{a b c d e f g h i j}}", "a7");
	assert(ds.toString(true), '{a:3(c d:1(b e) f:2(g h:1(i j)))}', 'a8');
	let r = ds.find(10);
	assert(ds.toString(true), '{a:3(c d:1(b e) f:2(g) h:1(i) j)}', 'a9');
	assert(r, 1, "a10");
	r = ds.find(2);
	assert(ds.toString(true), '{a:3(b c d:1(e) f:2(g) h:1(i) j)}', 'a9');
	assert(r, 1, "a12");
	console.log("passed tests");
} catch(e) {
    if (e instanceof AssertError)
		if (e.message.length > 0)
        	console.log(e.name + ': ' + e.message);
		else
			console.error(e.stack);
    else
        throw(e);
}
