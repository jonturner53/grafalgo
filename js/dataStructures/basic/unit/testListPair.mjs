/** \file TestListPair.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError } from '../../../Errors.mjs';
import ListPair from '../ListPair.mjs';

try {
	console.log('running basic tests');
	let n = 8; let lp = new ListPair(n);

	assert(lp.n, n, "a1");
	assert(lp.firstIn(), 0, "a2");
	assert(lp.lastIn(), 0, "a3");
	assert(lp.firstOut(), 1, "a4");
	assert(lp.lastOut(), n, "a5");
	assert(lp.nIn(), 0, "a6");
	assert(lp.nOut(), n, "a7");
	assert(lp, "[ : a b c d e f g h]", "a8");

	lp.swap(4); lp.swap(2);
	assert(lp, "[d b : a c e f g h]", "b1");
	lp.swap(6, 4); lp.swap(8, 0);
	assert(lp, "[h d f b : a c e g]", "b2");

	lp.fromString("[h g f : d b a c e]");
	assert(lp, "[h g f : d b a c e]", "c1");
	lp.expand(9);
	assert(lp.n, 9, "c2");
	assert(lp, "[h g f : d b a c e i]", "c3");

	console.log('tests passed');
} catch(e) {
    if (e instanceof AssertError)
		if (e.message.length > 0)
        	console.log(e.name + ': ' + e.message);
		else
			console.error(e.stack);
    else
        throw(e);
}
