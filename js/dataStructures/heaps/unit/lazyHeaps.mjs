/** \file lazyHeaps.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { AssertFail } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';
import List from '../../basic/List.mjs';
import LazyHeaps from '../LazyHeaps.mjs';

try {
	console.log('testing LazyHeaps');
{
let lazy = new LazyHeaps();
lazy.fromString('{[a:2 b:4 c:1 d:3] [e:4 f:1 g:5 h:3] ' +
                '[i:2 j:5 k:1 l:5 m:3]}');
let h = lazy.lazyMeld (1,6); h = lazy.lazyMeld(h,11);
console.log(lazy.toString(0x1e));
}

	let lh = new LazyHeaps();
	matches(lh.fromString('{[a:1 b:2 c:3 d:4] [h:8 g:7 j:10 i:9 e:5 f:6]}'),
			true, 'a0');
	matches(lh, '{[b:2 a:1 d:4 c:3] [h:8 g:7 j:10 i:9 e:5 f:6]}', 'a1');
	let [min,h] = lh.deletemin(5);
	matches(min, 5, 'a2'); matches(h, 6, 'a3');
	matches(lh, '{[b:2 a:1 d:4 c:3] [h:8 g:7 j:10 i:9 f:6] e:5}', 'a4');

	let lh2 = new LazyHeaps();
	matches(lh2.fromString(
				'{[b:2 a:1 d:4 c:3] [h:8 g:7 j:10 i:9 f:6] e:5}'), true, 'a5');
	matches(lh, lh2, 'a6');

	lh.meld(lh.find(1), lh.find(6));
	matches(lh, '{[b:2 a:1 d:4 c:3 h:8 g:7 j:10 i:9 f:6] [e:5]}', 'a7');
	lh.clear();
	for (let i = 1; i <= lh.n/2; i ++) lh.key(i, i);
	let r = lh.lazyMeld(1, 2);
		r = lh.lazyMeld(r, 3);
		r = lh.lazyMeld(r, 4);
		r = lh.lazyMeld(r, 5);
		r = lh.lazyMeld(r, 6);
	matches(lh, '{g:7 h:8 i:9 j:10 [a:1 b:2 c:3 d:4 e:5 f:6]}', 'a8');
	matches(lh.toString(0x1e),
		'{g:7 h:8 i:9 j:10 [((((a:1 D b:2) D c:3) D d:4) D e:5) *D f:6]}','a9');
	lh.findmin(r);
	matches(lh, '{[d:4 c:3 f:6 e:5 a:1 b:2] [g:7] [h:8] [i:9] [j:10]}', 'a10');
	matches(lh.toString(0x1e),
		'{[(d:4 c:3:2 (f:6 e:5 -)) *a:1:2 b:2] g:7 h:8 i:9 j:10}', 'a11');

} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
