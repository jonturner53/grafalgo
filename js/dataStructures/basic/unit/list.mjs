/** \file list.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../List.mjs';
import Scanner from '../Scanner.mjs';
import { AssertFail } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';

try {
	console.log('testing List');

	let l = new List(10);
	matches(l.n, 10, 'a1');
	matches(l.empty(), true, 'a2');
	matches(l.contains(3), false, 'a3');

	matches(l.fromString('[b e f c a d g i]'), true, 'b0');
	matches(l, '[b e f c a d g i]', 'b1');
	matches(l.contains(3), true, 'b2');
	matches(l.contains(8), false, 'b3');
	l.insert(10, 5);
	matches(l, '[b e j f c a d g i]', 'b4');
	l.deleteNext(10);
	matches(l, '[b e j c a d g i]', 'b5');
	l.delete(1);
	matches(l, '[b e j c d g i]', 'b5');
	matches(l.prev(4), 3, 'b6');
	matches(l.delete(l.first()), 5, 'b7');
	matches(l.delete(l.last()), 0, 'b8');
	l.push(1); l.enq(6); l.insert(2, 10);
	matches(l, '[a e j b c d g f]', 'b9');
	l.enq(13);
	matches(l, '[a e j b c d g f m]', 'b10');

	matches(l.value(3), undefined, 'c1');
	l.value(3, 22); matches(l.value(3), 22, 'c2');
	l.insert(26, 3, 5);
	let l2 = new List(); l2.fromString('[a e j b c z d g f m]');
	matches(l.equals(l2), false, 'c4');
	l2.value(3, 22); l2.value(26, 5);
	matches(!!l.equals(l2), true, 'c5');

	matches(l.fromString('[a:1 b e:5 d:4]'), true, 'd0');
	matches(l,'[a:1 b:0 e:5 d:4]', 'd1');

} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
