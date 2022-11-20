/** \file splayForest.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError } from '../../../common/Errors.mjs';
import List from '../../basic/List.mjs';
import SplayForest from '../SplayForest.mjs';

try {
	console.log('running basic tests');

	let sf = new SplayForest();
	sf.fromString('{[b a d c] [h g j i f]}');
	assert(sf, '{[b a *d c] [h g j *i f]}', 'a1');
	sf.delete(7,9);
	assert(sf, '{[b a *d c] [h j *i f]}', 'a2');
	sf.join(sf.find(1), 5, sf.find(10));
	assert(sf, '{[b a d c e h j i f]}', 'a3');
	sf.split(10);
	assert(sf, '{[b a d c e h] [i f] [j]}', 'a4');
	let r = sf.find(1); let l = new List();
	for (let u = sf.first(r); u != 0; u = sf.next(u)) l.enq(u);
	assert(l, '[b a d c e h]', 'a5');
	l.clear();
	for (let u = sf.last(r); u != 0; u = sf.prev(u)) l.enq(u);
	assert(l, '[h e c d a b]', 'a6');

	let r1 = sf.find(3); let r2 = sf.find(9);
	sf.join(r1,10,r2);
	assert(sf.toString(4), '{[((b a d) c (- e h)) *j (- i f)]}', 'b1');
	sf.delete(10,10);
	assert(sf.toString(4), '{[(b a d) *c (- e (- h (- i f)))]}', 'b2');

	sf.fromListString('{[a b c d] [e f g] [h i j k l m n] [p q r]}');
	assert(sf.toString(4),
			'{[(a b -) *c d] [e *f g] [((((h i -) j -) k -) l -) *m n] ' +
			'[p *q r]}', 'f1');
	let key = new Float32Array(18);
	for (let i = 0; i <= 18; i++) key[i] = i;
	assert(sf.search(9,13,key), 9, 'f3');

	key[15] = 10.5;
	sf.insertByKey(15, key, 13);
	assert(sf.toString(4),
			'{[(a b -) *c d] [e *f g] ' +
			'[((h i ((- j k) l -)) o -) *m n] [p *q r]}', 'f4');

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
