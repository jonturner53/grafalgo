/** \file balancedForest.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { AssertFail } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';
import BalancedForest from '../BalancedForest.mjs';

try {
	console.log('testing BalancedForest');

	let f = BalancedForest.fromString('{[a b c d e] [h i j k l m n o p q r]}');
	matches(!!f, true, 'a0');
	let s = f.verify();
	matches(s, '', 'a1 ' + s);
	matches(f,'{[a b c d e] [h i j k l m n o p q r]}', 'a2'),
	matches(f.toString(0xc),
			'{[a *b:2 (c d e)] [(h i:2 j) *k:3 (l m:2 (n o:2 (p q r)))]}',
			'a3');
	f.split(14); s = f.verify(); matches(s, '', 'a4 ' + s);
			 //{[a b c d e] f g [h i j k l m] n [o p q r]}
	matches(f,'{[a b c d e] [h i j k l m] [o p q r]}','a5');
	matches(f.toString(0xc),
			'{[a *b:2 (c d e)] [h *i:2 (j k:2 (- l m))] [(o p -) *q:2 r]}',
			'a6');

	f.join(2,6,17); s = f.verify(); matches(s, '', 'a7 ' + s);
	matches(f,'{[a b c d e f o p q r] [h i j k l m]}','a8');
	matches(f.toString(0xc),
			'{[(a b:2 (c d e)) *f:3 ((o p -) q:2 r)] [h *i:2 (j k:2 (- l m))]}',
			'a9');

	f.append(9,6); s = f.verify(); matches(s, '', 'a10 ' + s);
	matches(f,'{[h i j k l m a b c d e f o p q r]}','a11');
	matches(f.toString(0xc),
			'{[(((h i:2 j) k:2 l) m:3 (a b:2 (c d e))) *f:3 ((o p -) q:2 r)]}',
			'a12');
	f.delete(6, 6);
	matches(f.toString(0xc),
			'{[(((h i:2 j) k:2 l) m:3 (a b:2 (c d -))) *e:3 ' +
			  '((o p -) q:2 r)]}', 'a13');

	f = BalancedForest.fromString('{[a b c d e] [h i j k] [l m n p q r]}');
	matches(f.toString(0xc),
			'{[a *b:2 (c d e)] [h *i:2 (- j k)] [l *m:2 (n p:2 (- q r))]}', 'b1');

	f.addProperty(['key',0]);
	for (let i = 0; i <= 18; i++) f.key(i,i);
	matches(f.search(11,9), 11, 'b2');

	f.key(15,10.5);
	f.insertByKey(15, 13);
	matches(f.toString(0xc),
			'{[a:1 *b:2:2 (c:3 d:4 e:5)] [h:8 *i:9:2 (- j:10 k:11)] ' +
			'[(o:10.5 l:12 -) *m:13:2 (n:14 p:16:2 (- q:17 r:18))]}', 'b3');

	f.key(6, 15)
	f.insertByKey(6, 13);
	matches(f.toString(0xc),
			'{[a:1 *b:2:2 (c:3 d:4 e:5)] [h:8 *i:9:2 (- j:10 k:11)] ' +
			'[(o:10.5 l:12 -) *m:13:2 ((- n:14 f:15) p:16:2 (- q:17 r:18))]}', 'b4');

	let compare = (a,b) => a.localeCompare(b);
	f = new BalancedForest(6,['key',0]);
	f.key(1,'abc'); f.key(2,'bcd'); f.key(3,'cde'); f.key(4,'def');
	f.insertByKey(1, 0, compare);
	f.insertByKey(2, 1, compare);
	f.insertByKey(3, 2, compare);
	f.insertByKey(4, 2, compare);
	matches(f.toString(4), //,u => `${f.x2s(u)}:"${key[u]}"`),
		   '{[a:"abc" *b:"bcd" (- c:"cde" d:"def")]}','f5');

} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
