/** \file TestHeap_d.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError } from '../../../Errors.mjs';
import Adt from '../../Adt.mjs';
import Scanner from '../../basic/Scanner.mjs';
import Heap_d from '../Heap_d.mjs';

try {
	console.log('running basic tests');

	let n1 = 10; let h1 = new Heap_d(n1);
	
	assert(h1.n, 10, 'a1');
	assert(h1.empty(), 'a2');
	for (let i = 1; i <= n1; i++)
		assert(!h1.contains(i), 'a3 ' + i);

	h1.insert(3, 5); assert(h1, '{c:5}', 'b1');
	assert(!h1.empty(),'b2');
	assert(h1.contains(3),'b3');
	assert(h1.findmin(), 3, 'b4');
	h1.insert(6, 2); h1.insert(8, 1); h1.insert(7, 4);
	assert(h1, '{h:1 g:4 f:2 c:5}', 'b5');
	assert(h1.deletemin(), 8, 'b6');
	assert(h1, '{f:2 g:4 c:5}', 'b7');

	let n2 = 27; let h2 = new Heap_d(n2);
	h2.fromString('{g:4 f:2 c:5}');
	assert(h2, h1, 'e2');
	assert(h2, '{6:2 7:4 3:5}', 'e3');
	assert(h2.deletemin(), 6, 'e4');
	assert(!(h1.equals(h2)), 'e5');
	h1.changekey(3, 1);
	assert(h1, '{c:1 g:4 f:2}', 'e6');

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
