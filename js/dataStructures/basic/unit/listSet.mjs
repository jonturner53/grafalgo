/** \file listSet.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import ListSet from '../ListSet.mjs';
import { assert, AssertError } from '../../../common/Errors.mjs';

try {
	console.log('testing ListSet');

	let ls = new ListSet(8);

	assert(ls.n, 8, 'a1');
	for (let i = 1; i <= ls.n; i++)
		assert(ls.singleton(i), 'a2_' + i);
	assert(ls, '{[h]}', 'a3');

	ls.join(1, 3); ls.join(5, 6); ls.join(2, 7);
	assert(ls, '{[a c] [b g] [e f] [h]}', 'b1');
	let v = ls.join(1, 5);
	assert(ls, '{[a c e f] [b g] [h]}', v, 1, 'b2');
	assert(ls.last(1), 6, 'b4');
	assert(ls.next(1), 3, 'b5');
	assert(ls.prev(5), 3, 'b6');
	ls.delete(5, 1); 
	assert(ls, '{[a c f] [b g] [h]}', 'b7');
	ls.delete(1, 1); ls.delete(7, 2);
	assert(ls, '{[c f] [h]}', 'b8');
	assert(!ls.singleton(6), 'b9');
	assert(ls.singleton(7), 'b10');
	ls.clear(); 
	assert(ls, '{[h]}', 'b11');

	assert(ls.fromString('{[d i h k] [e a  c] [g b l ] [j f]}'), 'c0');
	assert(ls, '{[d i h k] [e a c] [g b l] [j f]}', 'c1');
	assert(ls.n, 12, 'c2');
	ls.rotate(4, 8); ls.rotate(7, 12); 
	assert(ls, '{[e a c] [h k d i] [j f] [l g b]}', 'c3');
	ls.sort();
	assert(ls, '{[a c e] [d h i k] [f j] [b g l]}', 'c4');
	ls.sort((a,b)=>b-a);
	assert(ls, '{[e c a] [k i h d] [j f] [l g b]}', 'c5');
	assert(ls.setEquals('{[a c e] [d h i k] [f j] [b g l]}'), 'c6');

	let pvec = new Array(10);
	let prop = (u,sc) => {
					if (!sc.verify(':')) {
						pvec[u] = 0; return true;
					}
					let p = sc.nextNumber();
					if (Number.isNaN(p)) return false;
					pvec[u] = p;
					return true;
				};
	ls.fromString('{[a:1 c:3] [b:2 e:5 d:4]}', prop);
	assert(ls,'{[a c] [b e d]}', 'd1');
	assert(pvec[4],4, 'd2');

} catch(e) {
    if (e instanceof AssertError)
		if (e.message.length > 0)
        	console.log(e.name + ': ' + e.message);
		else
			console.error(e.stack);
    else
        throw(e);
}
