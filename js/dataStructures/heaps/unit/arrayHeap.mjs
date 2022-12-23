/** \file arrayHeap.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError } from '../../../common/Errors.mjs';
import Top from '../../Top.mjs';
import Scanner from '../../basic/Scanner.mjs';
import ArrayHeap from '../ArrayHeap.mjs';

try {
	console.log('running basic tests');

	let n1 = 10; let h1 = new ArrayHeap(n1);
	
	assert(h1.n, 10, 'a1');
	assert(h1.empty(), 'a2');
	for (let i = 1; i <= n1; i++)
		assert(!h1.contains(i), 'a3 ' + i);

	h1.insert(10, 10); assert(h1, '[j:10]', 'b1');
	assert(!h1.empty(),'b2');
	assert(h1.contains(10),'b3');
	assert(h1.findmin(), 10, 'b4');
	h1.insert(6, 2); h1.insert(8, 1); h1.insert(7, 4);
	assert(h1, '[h:1 g:4 f:2 j:10]', 'b5');
	assert(h1.deletemin(), 8, 'b6');
	assert(h1, '[f:2 g:4 j:10]', 'b7');
	let stats = h1.getStats();
	assert(stats.insert, 4, 'b8');
	assert(stats.delete, 1, 'b9');
	assert(stats.changekey, 0, 'b10');
	assert(stats.siftup, 6, 'b11');
	assert(stats.siftdown, 3, 'b12');

	let h3 = new ArrayHeap(25, 2);
	assert(h3.fromString('[g:1 f:2 c:5 a:5 d:2 h:7 j:8 k:6 m:4]'), 'f0');
	assert(h3.toString(1),'[g:1(f:2(m:4(k:6 a:5) d:2) c:5(h:7 j:8))]','f1');

	h3.delete(1); assert(h3, '[g:1 f:2 c:5 d:2 h:7 j:8 k:6 m:4]', 'f2');
	h3.delete(10); assert(h3, '[g:1 f:2 c:5 d:2 h:7 k:6 m:4]', 'f3');
	h3.delete(7); assert(h3, '[f:2 c:5 d:2 h:7 k:6 m:4]', 'f4');
	h3.delete(11); assert(h3, '[f:2 c:5 d:2 h:7 m:4]', 'f5');
	h3.delete(13); assert(h3, '[f:2 c:5 d:2 h:7]', 'f6');

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
