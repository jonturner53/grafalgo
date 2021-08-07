/** \file TestDlists.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Dlists from '../Dlists.mjs';
import { assert, AssertError } from '../../../Errors.mjs';

try {
	console.log('running basic tests');

	let n = 8; let dl = new Dlists(n);

	assert(dl.n, n, "a1");
	for (let i = 1; i <= n; i++)
		assert(dl.singleton(i), "a2_" + i);
	assert(dl, "[(a), (b), (c), (d), (e), (f), (g), (h)]", "a3");

	dl.join(1, 3); dl.join(5, 6); dl.join(2, 7);
	assert(dl, "[(a c), (b g), (d), (e f), (h)]", "b1");
	let v = dl.join(1, 5);
	assert(dl, "[(a c e f), (b g), (d), (h)]", v, 1, "b2");
	assert(dl.first(1), 1, "b3");
	assert(dl.last(1), 6, "b4");
	assert(dl.next(1), 3, "b5");
	assert(dl.prev(5), 3, "b6");
	dl.delete(5, 1); 
	assert(dl, "[(a c f), (b g), (d), (e), (h)]", "b7");
	dl.delete(1, 1); dl.delete(7, 2);
	assert(dl, "[(a), (b), (c f), (d), (e), (g), (h)]", "b8");
	assert(!dl.singleton(6), "b9");
	assert(dl.singleton(7), "b10");
	dl.clear(); 
	assert(dl, "[(a), (b), (c), (d), (e), (f), (g), (h)]", "b11");

	dl.fromString("[(d i h k), (e a  c), (g b l ), (j f)]");
	assert(dl, "[(d i h k), (e a c), (g b l), (j f)]", "c1");
	assert(dl.n, 12, "c2");

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
