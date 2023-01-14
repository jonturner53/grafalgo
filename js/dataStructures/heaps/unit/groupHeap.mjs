/** \file groupHeap.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError } from '../../../common/Errors.mjs';
import List from '../../basic/List.mjs';
import GroupHeap from '../GroupHeap.mjs';

try {
	console.log('running basic tests');

	let dh = new GroupHeap();
	if (!dh.fromString('{1[a:3 b:2] 2@![c:2 d:5 e:1 j:7] ' +
					   '6[f:6 g:3] 4@[i:10]}'), 'a0');
	assert(dh,'{1[*a:3 b:2] 2@![c:2 *d:5 e:1 j:7] 6[*f:6 g:3] 4@[i:10]}', 'a1');
	dh.delete(9,4);
	assert(dh,'{1[*a:3 b:2] 2@![c:2 *d:5 e:1 j:7] 6[*f:6 g:3]}', 'a2');
	dh.divide(2,5,3);
	assert(dh,'{1[*a:3 b:2] 2[e:1 *j:7] 3[*c:2 d:5] 6[*f:6 g:3]}', 'a3');
	dh.activate(2); dh.deactivate(4);
	assert(dh.findmin(),5,'a4');
	assert(dh,'{1[*a:3 b:2] 2@![e:1 *j:7] 3[*c:2 d:5] 6[*f:6 g:3]}', 'a5');
	dh.add2keys(3);
	assert(dh,'{1[*a:3 b:2] 2@![e:4 *j:10] 3[*c:2 d:5] 6[*f:6 g:3]}', 'a6');
	dh.activate(3);
	assert(dh,'{1[*a:3 b:2] 2@[e:4 *j:10] 3@![*c:2 d:5] 6[*f:6 g:3]}', 'a7');
	dh.activate(6);
	assert(dh,'{1[*a:3 b:2] 2@[e:4 *j:10] 3@![*c:2 d:5] 6@[*f:6 g:3]}', 'a8');
	assert(dh.findmin(), 3, 'a9');
	dh.deactivate(3);
	assert(dh.findmin(), 7, 'a10');
	dh.clear(1);
	assert(dh,'{2@[e:4 *j:10] 3[*c:2 d:5] 6@![*f:6 g:3]}', 'b1');
	dh.insertAfter(1, 2, 2, 5);
	dh.insertAfter(2, 2, Infinity, 10);
	assert(dh,'{2@![e:4 *a:2 j:10 b:I] 3[*c:2 d:5] 6@[*f:6 g:3]}', 'b2');
	dh.delete(10,2); dh.insertAfter(10,3,7,3);
	assert(dh,'{2@![e:4 *a:2 b:I] 3[c:2 *j:7 d:5] 6@[*f:6 g:3]}', 'b3');
	assert(dh.toString(0),'[e:4 *a:2 b:I f:6 g:3]', 'b4');

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
