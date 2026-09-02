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

	let l = new List(10, 'value', 0);
	matches(l.n, 10, 'a1');
	matches(l.empty(), true, 'a2');
	matches(l.contains(3), false, 'a3');

	l = List.fromString('[b e f c a d j g]');
	matches(!!l, true, 'b0');
	matches(l, '[b e f c a d j g]', 'b1');
	matches(l.contains(3), true, 'b2');
	matches(l.contains(8), false, 'b3');
	l.insert(9, 5);
	matches(l, '[b e i f c a d j g]', 'b4');
	l.deleteNext(9);
	matches(l, '[b e i c a d j g]', 'b5');
	l.delete(1);
	matches(l, '[b e i c d j g]', 'b5');
	matches(l.prev(4), 3, 'b6');
	matches(l.delete(l.first()), 5, 'b7');
	matches(l.delete(l.last()), 0, 'b8');
	l.push(1); l.enq(6); l.insert(2, 9);
	matches(l, '[a e i b c d j f]', 'b9');

	l.addProperty('value', 0);
	matches(l.value(3), 0, 'c1');
	l.value(3, 22); matches(l.value(3), 22, 'c2');
	l.value(8, 5); l.insert(8, 3);
	matches(l,'[a e i b c:22 h:5 d j f]', 'c3');

	let l2 = List.fromString('[a e i b c h d j f]', 10, 'value', 0);
	matches(!!l.equals(l2), false, 'c4');
	l2.value(3, 22); l2.value(8, 5);
	matches(!!l.equals(l2), true, 'c4');
	l2.addProperty('flavor', 'bland');
	l2.flavor(5, 'sweet');
	matches(l2.flavor(5), 'sweet', 'c7');
	l2.reset_flavor();
	matches(l2.flavor(4), 'bland', 'c8');

	l = List.fromString('[a:1 b e:5 d:4]');
	matches(!!l, true, 'd0');
	matches(l,'[a:1 b:0 e:5 d:4]', 'd1');

	l.value(5, 'ee e'); l.value(2, 'abc');
	matches(l,'[a:1 b:"abc" e:"ee e" d:4]', 'd2');
	l.value(4, {x:1, y:4});
	matches(l.toString(),'[a:1 b:"abc" e:"ee e" d:{"x":1,"y":4}]', 'd3');
		// string comparison needed for complex values
} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
