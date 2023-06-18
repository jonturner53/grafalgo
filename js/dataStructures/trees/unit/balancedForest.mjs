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

	let f = new BalancedForest();

	matches(f.fromString('{[a b c d e] [h i j k l m n o p q r]}'), true, 'a0');
	let s = f.verify(); matches(s, '', 'a1 ' + s);
	matches(f,'{[a b c d e] [h i j k l m n o p q r]}','a2');
	matches(f.toString(0xc),
			'{[(a:1 b:1 c:1) *d:2 e:1] ' +
			 '[(h:1 i:2 j:1) *k:3 (l:1 m:2 ((n:1 o:1 p:1) q:2 r:1))]}', 'a3');

	f.split(14); s = f.verify(); matches(s, '', 'a4 ' + s);
	matches(f,'{[a b c d e] [h i j k l m] [o p q r]}','a5');
	matches(f.toString(0xc),
			'{[(a:1 b:1 c:1) *d:2 e:1] ' +
			 '[h:1 *i:2 (j:1 k:2 (- l:1 m:1))] ' +
			 '[(o:1 p:1 -) *q:2 r:1]}', 'a6');

	f.join(4,6,17); s = f.verify(); matches(s, '', 'a7 ' + s);
	matches(f,'{[a b c d e f o p q r] [h i j k l m]}','a8');
	matches(f.toString(0xc),
			'{[((a:1 b:1 c:1) d:2 e:1) *f:3 ((o:1 p:1 -) q:2 r:1)] ' +
			 '[h:1 *i:2 (j:1 k:2 (- l:1 m:1))]}', 'a9');

	f.append(9,6); s = f.verify(); matches(s, '', 'a10 ' + s);
	matches(f,'{[h i j k l m a b c d e f o p q r]}','a11');
	matches(f.toString(0xc),
			'{[(((h:1 i:2 j:1) k:2 l:1) m:3 ((a:1 b:1 c:1) d:2 e:1)) ' +
			 '*f:3 ((o:1 p:1 -) q:2 r:1)]}', 'a12');
	f.delete(6, 6);
	matches(f.toString(0xc),
			'{[(((h:1 i:2 j:1) k:2 l:1) m:3 (a:1 b:2 (c:1 d:1 -))) *e:3 ' +
			  '((o:1 p:1 -) q:2 r:1)]}', 'a13');

	f.fromString('{[a b c d e] [h i j k] [l m n p q r]}');
	matches(f.toString(0xc),
			'{[(a:1 b:1 c:1) *d:2 e:1] [(- h:1 i:1) *j:2 k:1] ' +
			'[l:1 *m:2 ((- n:1 p:1) q:2 r:1)]}', 'b1');
	let key = new Float32Array(18);
	for (let i = 0; i <= 18; i++) key[i] = i;
	matches(f.search(9,10,key), 9, 'b2');

	key[15] = 10.5;
	f.insertByKey(15, 13, key);
	matches(f.toString(0xc),
			'{[(a:1 b:1 c:1) *d:2 e:1] [(- h:1 i:1) *j:2 k:1] ' +
			'[(o:1 l:1 -) *m:2 ((- n:1 p:1) q:2 r:1)]}', 'b3');

	f.insertAfter(10, 13, 14);
	matches(f.toString(0xc),
			'{[(a:1 b:1 c:1) *d:2 e:1] ' +
			'[(o:1 l:1 -) *m:2 ((- n:1 (((- h:1 i:1) j:2 k:1) p:1 -)) ' +
			'q:2 r:1)]}', 'b4');

	let compare = (a,b) => a.localeCompare(b);
	f = new BalancedForest();
	key = [ '', 'abc', 'bcd', 'cde', 'def' ];
	f.insertByKey(1, 0, key, compare);
	f.insertByKey(2, 1, key, compare);
	f.insertByKey(3, 2, key, compare);
	f.insertByKey(4, 2, key, compare);
	matches(f.toString(4,u => `${f.x2s(u)}:${key[u]}`),
		   '{[a:abc *b:bcd (- c:cde d:def)]}','f5');

} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
