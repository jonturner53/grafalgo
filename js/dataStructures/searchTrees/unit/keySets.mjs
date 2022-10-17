/** \file balancedSets.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError } from '../../../common/Errors.mjs';
import List from '../../basic/List.mjs';
import KeySets from '../KeySets.mjs';

try {
	console.log('running basic tests');

	let ks = new KeySets();
	ks.fromString('{[b:2 a:1 d:4 c:3] [h:8 g:7 j:10 i:7 f:6] [e:5]}');
	assert(ks, '{[b:2 a:1 d:4 c:3] [h:8 g:7 j:10 i:7 f:6] [e:5]}', 'a1');
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
	assert(ks.search(2, r), 2, 'a7');
	assert(ks.search(5, r), 5, 'a8');
	assert(ks.search(4, r), 4, 'a9');
	ks.fromString('{[a:0] [b:0] [c:0] [d:0] [e:0]}');
	assert(ks,'{[a:0] [b:0] [c:0] [d:0] [e:0]}', 'b1');
	let root = ks.append(1,2);
		root = ks.append(root,3);
		root = ks.append(root,4);
		root = ks.append(root,5);
	assert(ks.toString(0xc),'{[(a:0:1 b:0:1 c:0:1) *d:0:2 e:0:1]}','b2');

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
