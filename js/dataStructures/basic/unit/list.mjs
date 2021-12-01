/** \file list.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../List.mjs';
import Scanner from '../Scanner.mjs';
import { assert, AssertError } from '../../../common/Errors.mjs';

try {
	console.log('running basic tests');

	let l = new List(10);
	assert(l.n, 10, 'a1');
	assert(l.empty(), 'a2');
	assert(!l.contains(3), 'a3');

	l.fromString('[b e f c a d g i]');
	assert(l, '[b e f c a d g i]', 'b1');
	assert(l.contains(3), 'b2');
	assert(!l.contains(8), 'b3');
	l.insert(10, 5);
	assert(l, '[b e j f c a d g i]', 'b4');
	l.deleteNext(10);
	assert(l, '[b e j c a d g i]', 'b5');
	l.delete(1);
	assert(l, '[b e j c d g i]', 'b5');
	assert(l.prev(4), 3, 'b6');
	assert(l.delete(l.first()), 2, 'b7');
	assert(l.delete(l.last()), 9, 'b8');
	l.push(1); l.enq(6); l.insert(2, 10);
	assert(l, '[a e j b c d g f]', 'b9');
	l.enq(13);
	assert(l, '[a e j b c d g f m]', 'b10');

	assert(l.value(3) == null, 'c1');
	l.setValue(3, 22); assert(l.value(3), 22, 'c2');
	l.insert(26, 3, 5); assert(l.value(26), 5, 'c3');
	let l2 = new List(); l2.fromString('[a e j b c z d g f m]');
	assert(l != l2, 'c4');
	l2.setValue(3, 22); l2.setValue(26, 5);
	assert(l.equals(l2), 'c5');

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
