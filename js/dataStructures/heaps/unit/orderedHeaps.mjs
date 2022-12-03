/** @file orderedHeaps.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError } from '../../../common/Errors.mjs';
import List from '../../basic/List.mjs';
import OrderedHeaps from '../OrderedHeaps.mjs';

try {
	console.log('running basic tests');

	let sh = new OrderedHeaps(10);
	sh.fromString('{[b:2 a:1 d:4 c:3] [h:8 g:7 j:10 i:9 f:6] [e:5]}');
	assert(sh,'{[b:2 *a:1 d:4 c:3] [h:8 *g:7 j:10 i:9 f:6] [e:5]}', 'a1');
	assert(sh.findmin(7),6,'a2');
		sh.insertAfter(5,10,5.5,7);
	assert(sh,'{[b:2 *a:1 d:4 c:3] [h:8 *g:7 j:10 e:5.5 i:9 f:6]}', 'a3');
		sh.add2keys(1,1);
	assert(sh,'{[b:3 *a:2 d:5 c:4] [h:8 *g:7 j:10 e:5.5 i:9 f:6]}', 'a4');
	assert(!sh.verify(), 'a4a' +sh.verify());
		sh.delete(7);

	assert(sh,'{[b:3 *a:2 d:5 c:4] [h:8 j:10 *e:5.5 i:9 f:6] [g:7]}', 'a5');
		sh.divide(9);
	assert(sh,'{[b:3 *a:2 d:5 c:4] [i:9 *f:6] [g:7] [h:8 *j:10 e:5.5]}', 'a6');
		sh.clear(6);
		sh.clear(10);
	assert(sh,'{[b:3 *a:2 d:5 c:4] [i:9] [f:6] [g:7] [h:8] [j:10] [e:5.5]}',
			  'a7');
	let h = sh.insertAfter(6,3,9,1);
		h = sh.insertAfter(7,4,7,h);
		h = sh.insertAfter(10,1,10,h);
	assert(sh,'{[e:5.5] [b:3 *a:2 j:10 d:5 g:7 c:4 f:9] [h:8] [i:9]}', 'a8');
	sh.add2keys(3,h);
	assert(sh,'{[e:5.5] [b:6 *a:5 j:13 d:8 g:10 c:7 f:12] [h:8] [i:9]}', 'a9');
		h = sh.insertAfter(8,2,8,h);
		h = sh.insertAfter(9,4,9,h);
		h = sh.insertAfter(5,10,2,h);
	assert(sh,'{[b:6 h:8 a:5 j:13 e:2 *d:8 i:9 g:10 c:7 f:12]}', 'b1');
	assert(sh.findmin(4), 5, 'b2');
	sh.changekey(6,1,4);
	assert(sh,'{[b:6 h:8 a:5 j:13 e:2 *d:8 i:9 g:10 c:7 f:1]}', 'b3');
	assert(sh.findmin(h), 6, 'b4');
	let [h1,h2] = sh.divide(10,h);
	assert(!sh.verify(), 'b4a' +sh.verify());
		[h1,h2] = sh.divide(4,h2);
		[h1,h2] = sh.divide(3,h2);
	assert(sh,'{[b:6 *h:8 a:5] [j:13 *e:2] [d:8 *i:9 g:10] [c:7 *f:1]}', 'b5');
	assert(sh.findmin(8), 1, 'b6');
	assert(sh.findmin(9), 4, 'b7');
	assert(!sh.verify(), 'b8' +sh.verify());

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
