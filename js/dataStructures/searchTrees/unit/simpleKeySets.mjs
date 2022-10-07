/** \file simpleKeySets.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError } from '../../../common/Errors.mjs';
import List from '../../basic/List.mjs';
import SimpleKeySets from '../SimpleKeySets.mjs';

try {
	console.log('running basic tests');

	let ks = new SimpleKeySets();
	ks.fromString('{[b:2 a:1 d:4 c:3] [h:8 g:7 j:10 i:7 f:6] [e:5]}');
	assert(ks, '{[b:2 a:1 c:3 d:4] [h:8 g:7 j:10 i:7 f:6] [e:5]}', 'a1');
	ks.delete(7);
	assert(ks, '{[b:2 a:1 d:4 c:3] [h:8 j:10 i:7 f:6] [e:5] [g:7]}', 'a2');
	ks.join(ks.find(1), 5, ks.find(10));
	assert(ks, '{[b:2 a:1 d:4 c:3 h:8 j:10 i:7 f:6 e:5] [g:7]}', 'a3');
	ks.split(9);
	assert(ks, '{[a:1 b:2 c:3 d:4 e:5 f:6] [g:7] [h:8 j:10] [i:7]}', 'a4');
	let r = ks.find(1); let l = new List();
	for (let u = ks.first(r); u != 0; u = ks.next(u)) l.enq(u);
	assert(l, '[a b c d e f]', 'a5');
	l.clear();
	
	for (let u = ks.last(r); u != 0; u = ks.prev(u)) l.enq(u);
	assert(l, '[f e d c b a]', 'a6');
	assert(ks.access(2, r), 2, 'a7');
	assert(ks.access(5, r), 5, 'a8');
	assert(ks.access(4, r), 4, 'a9');

	ks.fromString('{[b:2 a:1 d:4 c:3] [h:8 g:7 j:10 i:7 f:6] [e:5]}');
	r = ks.append(ks.find(1), ks.find(6));
	assert(ks, '{[b:2 a:1 d:4 c:3 h:8 g:7 j:10 i:7 f:6] [e:5]}', 'b1');

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
