/** \file reverseLists.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { AssertFail } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';
import ReverseLists from '../ReverseLists.mjs';

try {
	console.log('testing ReverseLists');

	let dl = new ReverseLists(8);

	matches(dl.n, 8, 'a1');
	for (let i = 1; i <= dl.n; i++)
		matches(dl.singleton(i), true, 'a2_' + i);
	matches(dl, '{[h]}', 'a3');

	dl.join(1, 3); dl.join(5, 6); dl.join(2, 7);
	matches(dl, '{[a c] [b g] [e f] [h]}', 'b1');
	let v = dl.join(1, 5);
	matches(v, 1, 'b2');
	matches(dl, '{[a c e f] [b g] [h]}', 'b3');
	matches(dl.last(1), 6, 'b4');
	let [i] = dl.next(1, 0); matches(i, 3, 'b5');
	[i] = dl.prev(5,6); matches(i, 3, 'b6');
	dl.pop(1);
	matches(dl, '{[c e f] [b g] [h]}', v, 1, 'b7');
	dl.clear(); 
	matches(dl, '{[h]}', 'b8');

	matches(dl.fromString('{[d i h k] [e a c] [g b l] [j f]}'), true, 'c0');
	matches(dl, '{[d i h k] [e a c] [g b l] [j f]}', 'c1');
	matches(dl.n, 12, 'c2');
	dl.reverse(4); dl.reverse(10);
	matches(dl, '{[e a c] [f j] [g b l] [k h i d]}', 'c3');
	dl.join(6, 11);
	matches(dl, '{[e a c] [g b l] [f j k h i d]}', 'c4');

} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
