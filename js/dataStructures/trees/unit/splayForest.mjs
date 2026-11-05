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

	let sf = SplayForest.fromString('{[b a d c] [h g j i f]}');
	matches(!!sf, true, 'a0');
	matches(sf, '{[b a d c] [h g j i f]}', 'a1');
	sf.delete(7,sf.find(7));
	matches(sf, '{[b a d c] [h j i f]}', 'a2');
	sf.join(sf.find(1), 5, sf.find(10));
	matches(sf, '{[b a d c e h j i f]}', 'a3');
	sf.split(10);
	matches(sf.toString(4), '{[(b a (- d c)) *e h] [i *f -]}', 'a4');
	let r = sf.find(1); let l = new List();
	for (let u = sf.first(r); u != 0; u = sf.next(u)) l.enq(u);
	matches(l, '[b a d c e h] [i f]', 'a5');
	l.clear();
	for (let u = sf.last(r); u != 0; u = sf.prev(u)) l.enq(u);
	matches(l, '[h e c d a b]', 'a6');

	let r1 = sf.find(3); let r2 = sf.find(9);
	sf.join(r1,10,r2);
	matches(sf.toString(), '{[b a d c e h j i f]}', 'b1');
	sf.delete(10,10);
	matches(sf.toString(), '{[b a d c e h i f]}', 'b2');

	sf = SplayForest.fromString(
			'{[a:1 b:2 c:3 d:4] [e:5 f:6 g:7] [i:9 h:8 j:10 k:11 l:12 m:13 n:14] ' +
			'[p:16 q:17 r:18] o:15}', 18, ['key',0]);
	matches(sf.toString(),
			'{[a:1 b:2 c:3 d:4] [e:5 f:6 g:7] [h:8 i:9 j:10 k:11 l:12 m:13 n:14] ' +
			'o:15 [p:16 q:17 r:18]}', 'f1');
	sf.key(15, 10.5);
	sf.insertByKey(15, sf.root(10));
	matches(sf.search(10.5,sf.root(10)), 15, 'f3');
	matches(sf.toString(),
			'{[a:1 b:2 c:3 d:4] [e:5 f:6 g:7] ' +
			'[h:8 i:9 j:10 o:10.5 k:11 l:12 m:13 n:14] ' +
            '[p:16 q:17 r:18]}', 'f4');

	let compare = (a,b) => a.localeCompare(b);
	let f = new SplayForest(6,['key',0]);
	f.key(1,'abc'); f.key(2,'bcd'); f.key(3,'cde'); f.key(4,'def');
	f.insertByKey(1, 0, compare);
	f.insertByKey(2, 1, compare);
	f.insertByKey(3, 2, compare);
	f.insertByKey(4, 2, compare);
	matches(f.toString(4),
		   '{[(a:"abc" b:"bcd" -) *d:"def" c:"cde"]}', 'f5');

} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
