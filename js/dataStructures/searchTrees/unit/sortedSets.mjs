/** \file sortedSets.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError } from '../../../common/Errors.mjs';
import List from '../../basic/List.mjs';
import SortedSets from '../SortedSets.mjs';

try {
	console.log('running basic tests');

	let ss = new SortedSets();
	ss.fromString('{(b:2 a:1 d:4 c:3) (h:8 g:7 j:10 i:7 f:6) (e:5)}');
	assert(ss, '{(b:2 a:1 d:4 c:3) (h:8 g:7 j:10 i:7 f:6) (e:5)}', 'a1');
	ss.delete(7);
	assert(ss, '{(b:2 a:1 d:4 c:3) (h:8 j:10 i:7 f:6) (e:5) (g:7)}', 'a2');
	ss.join(ss.find(1), 5, ss.find(10));
	assert(ss, '{(b:2 a:1 d:4 c:3 h:8 j:10 i:7 f:6 e:5) (g:7)}', 'a3');
	ss.split(9);
	assert(ss, '{(a:1 b:2 c:3 d:4 e:5 f:6) (g:7) (h:8 j:10) (i:7)}', 'a4');
	let r = ss.find(1); let l = new List();
	for (let u = ss.first(r); u != 0; u = ss.next(u)) l.enq(u);
	assert(l, '[a b c d e f]', 'a5');
	l.clear();
	
	for (let u = ss.last(r); u != 0; u = ss.prev(u)) l.enq(u);
	assert(l, '[f e d c b a]', 'a6');
	assert(ss.access(2, r), 2, 'a7');
	assert(ss.access(5, r), 5, 'a8');
	assert(ss.access(4, r), 4, 'a9');

	ss.fromString('{(b:2 a:1 d:4 c:3) (h:8 g:7 j:10 i:7 f:6) (e:5)}');
	r = ss.append(ss.find(1), ss.find(6));
	assert(ss, '{(b:2 a:1 d:4 c:3 h:8 g:7 j:10 i:7 f:6) (e:5)}', 'b1');

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
