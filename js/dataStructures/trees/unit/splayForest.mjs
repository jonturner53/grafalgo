/** \file splayForest.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { AssertFail } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';
import List from '../../basic/List.mjs';
import SplayForest from '../SplayForest.mjs';

try {
	console.log('testing SplayForest');

	let sf = new SplayForest();
	matches(sf.fromString('{[(b a -) *d c] [((h g -) j -) *i f]}'), true, 'a0');
	matches(sf, '{[(b a -) *d c] [((h g -) j -) *i f]}', 'a1');
	sf.delete(7,9);
	matches(sf, '{[(b a -) *d c] [h *j (- i f)]}', 'a2');
	sf.join(sf.find(1), 5, sf.find(10));
	matches(sf, '{[(b a (- d c)) *e (h j (- i f))]}', 'a3');
	sf.split(10);
	matches(sf, '{[(b a (- d c)) *e h] [- *i f]}', 'a4');
	let r = sf.find(1); let l = new List();
	for (let u = sf.first(r); u != 0; u = sf.next(u)) l.enq(u);
	matches(l, '[b a d c e h] [i f]', 'a5');
	l.clear();
	for (let u = sf.last(r); u != 0; u = sf.prev(u)) l.enq(u);
	matches(l, '[h e c d a b]', 'a6');

	let r1 = sf.find(3); let r2 = sf.find(9);
	sf.join(r1,10,r2);
	matches(sf.toString(), '{[((b a d) c (- e h)) *j (- i f)]}', 'b1');
	sf.delete(10,10);
	matches(sf.toString(), '{[((b a d) c -) *e (- h (- i f))]}', 'b2');

	sf.fromListString('{[a b c d] [e f g] [h i j k l m n] [p q r]}');
	matches(sf.toString(),
			'{[(a b -) *c d] [e *f g] [((((h i -) j -) k -) l -) *m n] ' +
			'[p *q r]}', 'f1');
	let key = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14, 10.5, 16,17,18];
	matches(sf.search(9,13,key), 9, 'f3');
	sf.insertByKey(15, 9, key);
	matches(sf.toString(),
			'{[(a b -) *c d] [e *f g] ' +
			'[(h i j) *o (k l (- m n))] [p *q r]}', 'f4');

	let compare = (a,b) => a.localeCompare(b);
	sf = new SplayForest();
	key = [ '', 'abc', 'bcd', 'cde', 'def' ];
	sf.insertByKey(1, 0, key, compare);
	sf.insertByKey(2, 1, key, compare);
	sf.insertByKey(3, 2, key, compare);
	sf.insertByKey(4, 3, key, compare);
	matches(sf.toString(),'{[((a b -) c -) *d -]}','f5');

} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
