/** \file listPair.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { AssertFail } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';
import ListPair from '../ListPair.mjs';

try {
	console.log('testing ListPair');
	let n = 8; let lp = new ListPair(n);

	matches(lp.n, n, 'a1');
	matches(lp.first(1), 0, 'a2');
	matches(lp.last(1), 0, 'a3');
	matches(lp.first(2), 1, 'a4');
	matches(lp.last(2), n, 'a5');
	matches(lp.length(1), 0, 'a6');
	matches(lp.length(2), n, 'a7');
	matches(lp, '[ : a b c d e f g h]', 'a8');

	lp.swap(4); lp.swap(2);
	matches(lp, '[d b : a c e f g h]', 'b1');
	lp.swap(6, 4); lp.swap(8, 0);
	matches(lp, '[h d f b : a c e g]', 'b2');

	matches(lp.fromString('[h g f : d b a c e]'), true, 'c0');
	matches(lp, '[h g f : d b a c e]', 'c1');
	lp.expand(10);
	matches(lp.n, 10, 'c2');
	matches(lp, '[h g f : d b a c e i j]', 'c3');

	matches(lp.in(1,1), false, 'd4');
	matches(lp.in(1,2), true,  'd5');
	matches(lp.in(8,1), true,  'd6');
	matches(lp.in(8,2), false, 'd7');
	matches(lp.length(2), 7, 'd8');
} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
