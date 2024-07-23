/** @file orderedHeaps.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { AssertFail } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';
import List from '../../basic/List.mjs';
import OrderedHeaps from '../OrderedHeaps.mjs';

try {
	console.log('testing OrderedHeaps');

	let sh = new OrderedHeaps(10);
	matches(sh.fromString('{[b:2 a:1 d:4 c:3] [h:8 g:7 j:10 i:9 f:6] [e:5]}'),
		   true, 'a0');
	matches(sh,'{[b:2 *a:1 d:4 c:3] [h:8 *g:7 j:10 i:9 f:6] [e:5]}', 'a1');
	matches(sh.findmin(7),6,'a2');
		sh.insertAfter(5,5.5,10,7);
	matches(sh,'{[b:2 *a:1 d:4 c:3] [h:8 *g:7 j:10 e:5.5 i:9 f:6]}', 'a3');
		sh.add2keys(1,1);
	matches(sh,'{[b:3 *a:2 d:5 c:4] [h:8 *g:7 j:10 e:5.5 i:9 f:6]}', 'a4');
	matches(sh.verify(), '', 'a4a' +sh.verify());
		sh.delete(7);

	matches(sh,'{[b:3 *a:2 d:5 c:4] [h:8 j:10 *e:5.5 i:9 f:6] [g:7]}', 'a5');
		sh.divide(9);
	matches(sh,'{[b:3 *a:2 d:5 c:4] [i:9 *f:6] [g:7] [h:8 *j:10 e:5.5]}', 'a6');
		sh.clear(6);
		sh.clear(10);
	matches(sh,'{[b:3 *a:2 d:5 c:4] [i:9] [f:6] [g:7] [h:8] [j:10] [e:5.5]}',
			  'a7');
	let h = sh.insertAfter(6,9,3,1);
		h = sh.insertAfter(7,7,4,h);
		h = sh.insertAfter(10,10,1,h);
	matches(sh,'{[e:5.5] [b:3 *a:2 j:10 d:5 g:7 c:4 f:9] [h:8] [i:9]}', 'a8');
	sh.add2keys(3,h);
	matches(sh,'{[e:5.5] [b:6 *a:5 j:13 d:8 g:10 c:7 f:12] [h:8] [i:9]}', 'a9');
		h = sh.insertAfter(8,8,2,h);
		h = sh.insertAfter(9,9,4,h);
		h = sh.insertAfter(5,2,10,h);
	matches(sh,'{[b:6 h:8 a:5 j:13 e:2 *d:8 i:9 g:10 c:7 f:12]}', 'b1');
	matches(sh.findmin(4), 5, 'b2');
	sh.changekey(6,4,1);
	matches(sh,'{[b:6 h:8 a:5 j:13 e:2 *d:8 i:9 g:10 c:7 f:1]}', 'b3');
	matches(sh.findmin(h), 6, 'b4');
	let [h1,h2] = sh.divide(10,h);
	matches(sh.verify(), '', 'b4a' +sh.verify());
		[h1,h2] = sh.divide(4,h2);
		[h1,h2] = sh.divide(3,h2);
	matches(sh,'{[b:6 *h:8 a:5] [j:13 *e:2] [d:8 *i:9 g:10] [c:7 *f:1]}', 'b5');
	matches(sh.findmin(8), 1, 'b6');
	matches(sh.findmin(9), 4, 'b7');
	sh.append(6,8);
	matches(sh,'{[c:7 *f:1 b:6 h:8 a:5] [j:13 *e:2] [d:8 *i:9 g:10]}', 'b8');
	matches(sh.verify(), '', 'b9' +sh.verify());

} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
