/** \file keySets.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { AssertFail } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';
import List from '../../basic/List.mjs';
import KeySets from '../KeySets.mjs';

try {
	console.log('testing KeySets');

	let ks = new KeySets();
	matches(ks.fromString('{[b:2 a:1 d:4 c:3] [h:8 g:7 j:10 i:7 f:6] e:5}'),
			true,'a0');
	matches(ks, '{[b:2 a:1 d:4 c:3] [h:8 g:7 j:10 i:7 f:6] e:5}', 'a1');
	ks.delete(7,ks.find(7));
	matches(ks, '{[b:2 a:1 d:4 c:3] [h:8 j:10 i:7 f:6] e:5 g:7}', 'a2');
	ks.join(ks.find(1), 5, ks.find(10));
	matches(ks, '{[b:2 a:1 d:4 c:3 h:8 j:10 i:7 f:6 e:5] g:7}', 'a3');
	ks.split(9);
	matches(ks, '{[a:1 b:2 c:3 d:4 e:5 f:6] g:7 [h:8 j:10] i:7}', 'a4');
	matches(ks.toString(0xe),
			'{[a:1 *b:2:2 ((c:3 d:4 -) e:5:2 f:6)] g:7 i:7 [h:8 *j:10 -]}',
			'a4.1');
	let r = ks.find(1); let l = new List();
	for (let u = ks.first(r); u != 0; u = ks.next(u)) l.enq(u);
	matches(l, '[a b c d e f]', 'a5');
	matches(ks.lookup(2, r), 2, 'a7');
	matches(ks.lookup(5, r), 5, 'a8');
	matches(ks.lookup(7, r), 0, 'a9');
	matches(ks.in(5, r), true, 'a10');

	ks.reset(10, (a,b) => a.localeCompare(b)); // switch to string keys
	matches(ks.fromString('{[a:"bb" b:"aa" c:"" d:"c c"] e:"ee"}'), true, 'b0');
	matches(ks, '{[b:"aa" a:"bb" d:"c c" c:""] e:"ee"}', 'b1');
	matches(ks.toString(6), '{[c:"" *b:"aa" (- a:"bb" d:"c c")] e:"ee"}', 'b2');
	matches(ks.lookup('c c',1), 4, 'b3');

	ks.reset(4, (a,b) => (a[0]!=b[0] ? a[0]-b[0] : a[1]-b[1]));
	ks.fromString('{[a:[2,1] b:[1,2] c:[1,1] d:[2,2]]}');
	matches(ks.toString(6), '{[c:[1,1] *b:[1,2] (- a:[2,1] d:[2,2])]}', 'b4');

	ks.reset(4, (a,b) => (a.real!=b.real ? a.real-b.real : a.imag-b.imag));
	ks.fromString('{[a:{"real":2, "imag":1} b:{"real":1, "imag":2} ' +
					'c:{"real":1, "imag":1} d:{"real":2, "imag":2}]}');
	matches(ks.toString(6),
				'{[c:{"real":1,"imag":1} *b:{"real":1,"imag":2} ' +
				'(- a:{"real":2,"imag":1} d:{"real":2,"imag":2})]}', 'b5');
} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
