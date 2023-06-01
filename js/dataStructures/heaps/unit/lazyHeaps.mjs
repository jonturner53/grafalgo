/** \file lazyHeaps.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError } from '../../../common/Errors.mjs';
import List from '../../basic/List.mjs';
import LazyHeaps from '../LazyHeaps.mjs';

try {
	console.log('testing LazyHeaps');

	let n = 20;
	let lh = new LazyHeaps(n);
	let hlist1 = new List(n); let hlist2 = new List(20);
	for (let i = 1; i <= n/2; i ++) {
		lh.key(i, i);
		if (i < n/4) hlist1.enq(i);
		else hlist2.enq(i);
	}
	lh.heapify(hlist1);
	assert(lh, '{[b:2 a:1 d:4 c:3] [e:5] [f:6] [g:7] [h:8] [i:9] [j:10]}',
			   'a1');
	lh.heapify(hlist2);
	assert(lh, '{[b:2 a:1 d:4 c:3] [h:8 g:7 j:10 i:9 e:5 f:6]}', 'a2');
	let [min,h] = lh.deletemin(5);
	assert(min, 5, 'a3.1'); assert(h, 11, 'a3.2');
	assert(lh, '{[b:2 a:1 d:4 c:3] [h:8 g:7 j:10 i:9 f:6] [e:5]}', 'a4');

	let lh2 = new LazyHeaps();
	assert(lh2.fromString(
				'{[b:2 a:1 d:4 c:3] [h:8 g:7 j:10 i:9 f:6] [e:5]}', 'a5'));
	assert(lh, lh2, 'a6');
	lh.meld(lh.find(1), lh.find(6));
	assert(lh, '{[b:2 a:1 d:4 c:3 h:8 g:7 j:10 i:9 f:6] [e:5]}', 'a7');
	lh.clear();
	for (let i = 1; i <= n; i ++) lh.key(i, i);
	let r = lh.lazyMeld(1, 2);
	r = lh.lazyMeld(r, 3);
	r = lh.lazyMeld(r, 4);
	r = lh.lazyMeld(r, 5);
	r = lh.lazyMeld(r, 6);
	assert(lh, '{[g:7] [h:8] [i:9] [j:10] [a:1 b:2 c:3 d:4 e:5 f:6]}',
				'a7');
	assert(lh.toString(0x1e),
		'{[g:7:1] [h:8:1] [i:9:1] [j:10:1] ' +
		'[((((a:1:1 11! b:2:1) 12! c:3:1) 13! d:4:1) 14! e:5:1) *15! f:6:1]}',
		'a8');
	lh.findmin(r);
	assert(lh, '{[d:4 c:3 f:6 e:5 a:1 b:2] [g:7] [h:8] [i:9] [j:10]}', 'a9');
	assert(lh.toString(0x1e),
		'{[(d:4:1 c:3:2 (f:6:1 e:5:1 -)) *a:1:2 b:2:1] ' +
		'[g:7:1] [h:8:1] [i:9:1] [j:10:1]}', 'a10');

} catch(e) {
	if (e instanceof AssertError)
		if (e.message.length > 0)
			console.log(e.name + ': ' + e.message);
		else
			console.error(e.stack);
	else
		throw(e);
}
