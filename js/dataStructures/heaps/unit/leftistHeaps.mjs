/** \file leftistHeaps.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { AssertFail } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';
import List from '../../basic/List.mjs';
import LeftistHeaps from '../LeftistHeaps.mjs';

try {
	console.log('testing LeftistHeaps');

	let n = 10;
	let lh = new LeftistHeaps(n);
	let hlist1 = new List(n); let hlist2 = new List(20);
	for (let i = 1; i <= n; i ++) {
		lh.key(i, i);
		if (i < n/2) hlist1.enq(i);
		else hlist2.enq(i);
	}
	lh.heapify(hlist1);
	matches(lh, '{[b:2 a:1 d:4 c:3] e:5 f:6 g:7 h:8 i:9 j:10}','a1');
	lh.heapify(hlist2);
	matches(lh, '{[b:2 a:1 d:4 c:3] [h:8 g:7 j:10 i:9 e:5 f:6]}', 'a2');
	let [min,h] = lh.deletemin(5);
	matches(min, 5, 'a3.1'); matches(h, 6, 'a3.2');
	matches(lh, '{[b:2 a:1 d:4 c:3] [h:8 g:7 j:10 i:9 f:6] e:5}', 'a4');
	let lh2 = new LeftistHeaps();
	matches(lh2.fromString('{[b:2 a:1 d:4 c:3] [h:8 g:7 j:10 i:9 f:6] [e:5]}'),
		   true, 'a5');
	matches(lh, lh2, 'a6');
	lh.meld(1, 6);
	matches(lh, '{[b:2 a:1 d:4 c:3 h:8 g:7 j:10 i:9 f:6] e:5}', 'a7');

} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
