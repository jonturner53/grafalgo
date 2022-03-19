/** \file dualkeySets.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError } from '../../../common/Errors.mjs';
import List from '../../basic/List.mjs';
import DualkeySets from '../DualkeySets.mjs';

try {
	console.log('running basic tests');

	let ss = new DualkeySets();
	ss.fromString('{(b:2:21 a:1:23 d:4:20 c:3:27) ' +
				  '(h:8:20 g:7:30 j:10:31 i:7:27 f:6:37) (e:5:29)}');
	assert(ss, '{(b:2:21 a:1:23 d:4:20 c:3:27) (e:5:29) ' +
			   '(h:8:20 g:7:30 j:10:31 i:7:27 f:6:37)}', 'a1');
	ss.delete(7);
	assert(ss, '{(b:2:21 a:1:23 d:4:20 c:3:27) (e:5:29) (g:7:30)' +
			   '(h:8:20 j:10:31 i:7:27 f:6:37)}', 'a2');
	ss.join(ss.find(1), 5, ss.find(10));
	assert(ss, '{(b:2:21 a:1:23 d:4:20 c:3:27 e:5:29 ' +
			   'h:8:20 j:10:31 i:7:27 f:6:37) (g:7:30)}', 'a3');
	ss.split(9);
	assert(ss, '{(b:2:21 a:1:23 d:4:20 c:3:27 e:5:29 f:6:37) ' +
			   '(g:7:30) (h:8:20 j:10:31) (i:7:27)}', 'a4');
	let r = ss.find(1); let l = new List();
	for (let u = ss.first(r); u != 0; u = ss.next(u)) l.enq(u);
	assert(l, '[a b c d e f]', 'a5');
	l.clear();
	for (let u = ss.last(r); u != 0; u = ss.prev(u)) l.enq(u);
	assert(l, '[f e d c b a]', 'a6');
	assert(ss.access(2, r), 2, 'a7');
	assert(ss.access(5, r), 5, 'a8');
	assert(ss.access(4, r), 4, 'a9');
	assert(ss.findmin(3, ss.find(1)), 2, 'a10');
	assert(ss.findmin(5, ss.find(1)), 4, 'a11');

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
