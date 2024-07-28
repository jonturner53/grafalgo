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

	let oh = new OrderedHeaps(10);
	matches(oh.fromString('{[b:2 a:1 d:4 c:3] [h:8 g:7 j:10 i:9 f:6] [e:5]}'),
		   true, 'a0');
	matches(oh,'{[b:2 a:1 d:4 c:3] [h:8 g:7 j:10 i:9 f:6] [e:5]}', 'a1');
	matches(oh.findmin(7),6,'a2');
		oh.insertAfter(5,5.5,10,7);
	matches(oh,'{[b:2 a:1 d:4 c:3] [h:8 g:7 j:10 e:5.5 i:9 f:6]}', 'a3');
		oh.add2keys(1,1);
	matches(oh,'{[b:3 a:2 d:5 c:4] [h:8 g:7 j:10 e:5.5 i:9 f:6]}', 'a4');
	matches(oh.verify(), '', 'a4a' +oh.verify());
		oh.delete(7);

	matches(oh,'{[b:3 a:2 d:5 c:4] [h:8 j:10 e:5.5 i:9 f:6] [g:7]}', 'a5');
		oh.divide(9);
	matches(oh,'{[b:3 a:2 d:5 c:4] [i:9 f:6] [g:7] [h:8 j:10 e:5.5]}', 'a6');
		oh.clear(6);
		oh.clear(10);
	matches(oh,'{[b:3 a:2 d:5 c:4] [i:9] [f:6] [g:7] [h:8] [j:10] [e:5.5]}',
			  'a7');
	let h = oh.insertAfter(6,9,3,1);
		h = oh.insertAfter(7,7,4,h);
		h = oh.insertAfter(10,10,1,h);
	matches(oh,'{[e:5.5] [b:3 a:2 j:10 d:5 g:7 c:4 f:9] [h:8] [i:9]}', 'a8');
	oh.add2keys(3,h);
	matches(oh,'{[e:5.5] [b:6 a:5 j:13 d:8 g:10 c:7 f:12] [h:8] [i:9]}', 'a9');
		h = oh.insertAfter(8,8,2,h);
		h = oh.insertAfter(9,9,4,h);
		h = oh.insertAfter(5,2,10,h);
	matches(oh,'{[b:6 h:8 a:5 j:13 e:2 d:8 i:9 g:10 c:7 f:12]}', 'b1');
	matches(oh.findmin(4), 5, 'b2');
	oh.changekey(6,1,4);
	matches(oh,'{[b:6 h:8 a:5 j:13 e:2 d:8 i:9 g:10 c:7 f:1]}', 'b3');
	matches(oh.findmin(h), 6, 'b4');
	let [h1,h2] = oh.divide(10,h);
	matches(oh.verify(), '', 'b4a' +oh.verify());
		[h1,h2] = oh.divide(4,h2);
		[h1,h2] = oh.divide(3,h2);
	matches(oh,'{[b:6 h:8 a:5] [j:13 e:2] [d:8 i:9 g:10] [c:7 f:1]}', 'b5');
	matches(oh.findmin(8), 1, 'b6');
	matches(oh.findmin(9), 4, 'b7');
	oh.append(6,8);
	matches(oh,'{[c:7 f:1 b:6 h:8 a:5] [j:13 e:2] [d:8 i:9 g:10]}', 'b8');
	matches(oh.verify(), '', 'b9' +oh.verify());

} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
