/** \file listPair.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError } from '../../../common/Errors.mjs';
import ListPair from '../ListPair.mjs';

try {
	console.log('testing ListPair');
	let n = 8; let lp = new ListPair(n);

	assert(lp.n, n, 'a1');
	assert(lp.first(1), 0, 'a2');
	assert(lp.last(1), 0, 'a3');
	assert(lp.first(2), 1, 'a4');
	assert(lp.last(2), n, 'a5');
	assert(lp.length(1), 0, 'a6');
	assert(lp.length(2), n, 'a7');
	assert(lp, '[ : a b c d e f g h]', 'a8');

	lp.swap(4); lp.swap(2);
	assert(lp, '[d b : a c e f g h]', 'b1');
	lp.swap(6, 4); lp.swap(8, 0);
	assert(lp, '[h d f b : a c e g]', 'b2');

	assert(lp.fromString('[h g f : d b a c e]'), 'c0');
	assert(lp, '[h g f : d b a c e]', 'c1');
	lp.expand(10);
	assert(lp.n, 10, 'c2');
	assert(lp, '[h g f : d b a c e i j]', 'c3');

	assert(lp.in(1,1), false, 'd4');
	assert(lp.in(1,2), true,  'd5');
	assert(lp.in(8,1), true,  'd6');
	assert(lp.in(8,2), false, 'd7');
	assert(lp.length(2), 7, 'd8');
} catch(e) {
    if (e instanceof AssertError)
		if (e.message.length > 0)
        	console.log(e.name + ': ' + e.message);
		else
			console.error(e.stack);
    else
        throw(e);
}
