/** \file listSet.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { AssertFail } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';
import ListSet from '../ListSet.mjs';

try {
	console.log('testing ListSet');

	let ls = new ListSet(8);

	matches(ls.n, 8, 'a1');
	for (let i = 1; i <= ls.n; i++)
		matches(ls.singleton(i), true, 'a2_' + i);
	matches(ls, '{[h]}', 'a3');

	ls.join(1, 3); ls.join(5, 6); ls.join(2, 7);
	matches(ls, '{[a c] [b g] [e f] h}', 'b1');
	let v = ls.join(1, 5);
	matches(ls, '{[a c e f] [b g] h}', v, 1, 'b2');
	matches(ls.last(1), 6, 'b4');
	matches(ls.next(1), 3, 'b5');
	matches(ls.prev(5), 3, 'b6');
	ls.delete(5, 1); 
	matches(ls, '{[a c f] [b g] h}', 'b7');
	ls.delete(1, 1); ls.delete(7, 2);
	matches(ls, '{[c f] [h]}', 'b8');
	matches(ls.singleton(6), false, 'b9');
	matches(ls.singleton(7), true, 'b10');
	ls.clear(); 
	matches(ls, '{[h]}', 'b11');

	matches(ls.fromString('{[d i h k] [e a  c] [g b l ] [j f]}'), true, 'c0');
	matches(ls, '{[d i h k] [e a c] [g b l] [j f]}', 'c1');
	matches(ls.n, 12, 'c2');
	ls.rotate(4, 8); ls.rotate(7, 12); 
	matches(ls, '{[e a c] [h k d i] [j f] [l g b]}', 'c3');
	ls.sort();
	matches(ls, '{[a c e] [d h i k] [f j] [b g l]}', 'c4');
	ls.sort((a,b)=>b-a);
	matches(ls, '{[e c a] [k i h d] [j f] [l g b]}', 'c5');
	matches(!!ls.setEquals('{[a c e] [d h i k] [f j] [b g l]}'), true, 'c6');

	let property = new Array(10).fill(0);
	let prop = (u,sc) => {
					if (!sc.verify(':')) {
						pvec[u] = 0; return true;
					}
					let p = sc.nextNumber();
					if (Number.isNaN(p)) return false;
					property[u] = p;
					return true;
				};
	let listProp = new Array(10).fill(0);
	let listLabel = (l, sc) => {
						let q = sc.nextInt(false);
						if (Number.isNaN(q)) return false;
						listProp[l] = q;
						return true;
					};
	ls.fromString('{[a:1 c:3] [b:2 e:5 d:4]7 f:2}', prop, listLabel);
	matches(ls,'{[a c] [b e d] f}', 'd1');
	matches(property[4],4, 'd2');
	matches(listProp[2],7, 'd3');
} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
