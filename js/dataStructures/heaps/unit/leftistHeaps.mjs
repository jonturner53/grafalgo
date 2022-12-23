/** \file leftistHeaps.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError } from '../../../common/Errors.mjs';
import List from '../../basic/List.mjs';
import LeftistHeaps from '../LeftistHeaps.mjs';

try {
	console.log('running basic tests');

	let n = 10;
	let lh = new LeftistHeaps(n);
	let hlist1 = new List(n); let hlist2 = new List(20);
	for (let i = 1; i <= n; i ++) {
		lh.key(i, i);
		if (i < n/2) hlist1.enq(i);
		else hlist2.enq(i);
	}
	lh.heapify(hlist1);
	assert(lh, '{[b:2 a:1 d:4 c:3] [e:5] [f:6] [g:7] [h:8] [i:9] [j:10]}','a1');
	lh.heapify(hlist2);
	assert(lh, '{[b:2 a:1 d:4 c:3] [h:8 g:7 j:10 i:9 e:5 f:6]}', 'a2');
	let [min,h] = lh.deletemin(5);
	assert(min, 5, 'a3.1'); assert(h, 6, 'a3.2');
	assert(lh, '{[b:2 a:1 d:4 c:3] [h:8 g:7 j:10 i:9 f:6] [e:5]}', 'a4');
	let lh2 = new LeftistHeaps();
	assert(lh2.fromString('{[b:2 a:1 d:4 c:3] [h:8 g:7 j:10 i:9 f:6] [e:5]}'),
		   'a5');
	assert(lh, lh2, 'a6');
	lh.meld(1, 6);
	assert(lh, '{[b:2 a:1 d:4 c:3 h:8 g:7 j:10 i:9 f:6] [e:5]}', 'a7');

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
