/** \file TestList.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../List.mjs';
import Scanner from '../Scanner.mjs';
import { assert, AssertError } from '../../../Errors.mjs';

try {
	console.log('running basic tests');

	let n1 = 10; let l1 = new List(n1);
	assert(l1.n, 10, "a1");

	assert(l1.empty(), "a2");
	assert(l1.consistent(), "a3");

	for (let i = 1; i <= n1; i++)
		assert(!l1.contains(i), "a4 " + i);


	l1.insert(1, 0); assert(l1, "[a]", "b1");
	assert(l1.consistent(), "b2");
	assert(!l1.empty(),"b3");
	assert(l1.contains(1),"b4");

	for (let i = 3; i <= n1; i += 2) l1.enq(i);
	assert(l1, "[a c e g i]", "c1");
	assert(l1.consistent(), "c2");
	assert(l1.contains(5), "c3");
	assert(!l1.contains(4), "c4");

	let v = l1.pop(); assert(l1, "[c e g i]", v, 1, "d1");
	assert(l1.consistent(), "d2");
	assert(!l1.contains(1), "d3");
	l1.insert(8, 5); assert(l1, "[c e h g i]", "d4");
	l1.deleteNext(8); assert(l1, "[c e h i]", "d5");
	l1.deleteNext(8); assert(l1, "[c e h]", "d6");
	l1.deleteNext(0); assert(l1, "[e h]", "d7");
	l1.push(4); assert(l1, "[d e h]", "d8");
	assert(l1.consistent(), "d9");
	assert(!l1.empty(), "d10");

	let n2 = 27; let l2 = new List(n2);
	l2.push(1); l2.push(2); l2.push(3);
	assert(l2, "[3 2 1]", "e1");
	assert(l2.consistent(), "e2");
	l1.clear(); l1.enq(3); l1.enq(2); l1.enq(1);
	assert(l1, l2, "e3");
	assert(l1, "[c b a]", "e4");

	l1.fromString("[b c d e]");
	assert(l1, "[b c d e]", "f1");
	l1.expand(15); assert(l1.n, 15, "f2");
	l1.fromString("[ b  g   27 ]");
	assert(l1, "[2 7 27]", l1.n, 27, "f3");
	l1.reset(10); assert(l1, "[]", "f4");
	
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
