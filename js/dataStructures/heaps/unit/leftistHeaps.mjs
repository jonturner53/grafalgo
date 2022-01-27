/** \file leftistHeaps.java
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
		lh.setKey(i, i);
		if (i < n/2) hlist1.enq(i);
		else hlist2.enq(i);
	}
	lh.heapify(hlist1);
	assert(lh, '{(b:2 a:1 d:4 c:3) (e:5) (f:6) (g:7) (h:8) (i:9) (j:10)}','a1');
	lh.heapify(hlist2);
	assert(lh, '{(b:2 a:1 d:4 c:3) (h:8 g:7 j:10 i:9 e:5 f:6)}', 'a2');
	let [min,h] = lh.deletemin(5);
	assert(min, 5, 'a3.1'); assert(h, 6, 'a3.2');
	assert(lh, '{(b:2 a:1 d:4 c:3) (h:8 g:7 j:10 i:9 f:6) (e:5)}', 'a4');
	let lh2 = new LeftistHeaps();
	lh2.fromString('{(b:2 a:1 d:4 c:3) (h:8 g:7 j:10 i:9 f:6) (e:5)}');
	assert(lh, lh2, 'a5');
	lh.meld(1, 6);
	assert(lh, '{(b:2 a:1 d:4 c:3 h:8 g:7 j:10 i:9 f:6) (e:5)}', 'a6');

	lh.clear();
	for (let i = 1; i <= n; i ++) lh.setKey(i, i);
	let r = lh.lazyMeld(1, 2); r = lh.lazyMeld(r, 3); r = lh.lazyMeld(r, 4);
	r = lh.lazyMeld(r, 5); r = lh.lazyMeld(r, 6);
	assert(lh.toString(1), '{(g:7:1) (h:8:1) (i:9:1) (j:10:1) ' + 
	    '(((((a:1:1 -:2 b:2:1) -:2 c:3:1) -:2 d:4:1) -:2 e:5:1) *-:2 f:6:1)}',
		'a7');
	lh.findmin(r);
	assert(lh.toString(1), '{((d:4:1 c:3:2 (f:6:1 e:5:1)) *a:1:2 b:2:1) ' +
						   '(g:7:1) (h:8:1) (i:9:1) (j:10:1)}', 'a8');

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