/** \file reverseLists.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import ReverseLists from '../ReverseLists.mjs';
import { assert, AssertError } from '../../../common/Errors.mjs';

try {
	console.log('running basic tests');

	let dl = new ReverseLists(8);

	assert(dl.n, 8, "a1");
	for (let i = 1; i <= dl.n; i++)
		assert(dl.singleton(i), "a2_" + i);
	assert(dl, "[]", "a3");

	dl.join(1, 3); dl.join(5, 6); dl.join(2, 7);
	assert(dl, "[(a c), (b g), (e f)]", "b1");
	let v = dl.join(1, 5);
	assert(dl, "[(a c e f), (b g)]", v, 1, "b2");
	assert(dl.last(1), 6, "b4");
	let [i] = dl.next(1, 0); assert(i, 3, "b5");
	[i] = dl.prev(5,6); assert(i, 3, "b6");
	dl.pop(1);
	assert(dl, "[(c e f), (b g)]", v, 1, "b7");
	dl.clear(); 
	assert(dl, "[]", "b8");

	dl.fromString("[(d i h k), (e a  c), (g b l), (j f)]");
	assert(dl, "[(d i h k), (e a c), (g b l), (j f)]", "c1");
	assert(dl.n, 12, "c2");
	dl.reverse(4); dl.reverse(10);
	assert(dl, "[(e a c), (f j), (g b l), (k h i d)]", "c3");
	dl.join(6, 11);
	assert(dl, "[(e a c), (g b l), (f j k h i d)]", "c4");

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
