/** \file balancedForest.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError } from '../../../common/Errors.mjs';
import BalancedForest from '../BalancedForest.mjs';

try {
	console.log('running basic tests');

	let f = new BalancedForest();

	f.fromString('{[a b c d e] [h i j k l m n o p q r]}');
	let s = f.verify(); assert(!s, 'a1 ' + s);
	assert(f,'{[a b c d e] [h i j k l m n o p q r]}','a1');
	assert(f.toString(0xc),
			'{[(a:1 b:1 c:1) *d:2 e:1] ' +
			 '[(h:1 i:2 j:1) *k:3 (l:1 m:2 ((n:1 o:1 p:1) q:2 r:1))]}', 'a3');

	f.split(14); s = f.verify(); assert(!s, 'a4 ' + s);
	assert(f,'{[a b c d e] [h i j k l m] [o p q r]}','a5');
	assert(f.toString(0xc),
			'{[(a:1 b:1 c:1) *d:2 e:1] ' +
			 '[h:1 *i:2 (j:1 k:2 (- l:1 m:1))] ' +
			 '[(o:1 p:1 -) *q:2 r:1]}', 'a6');

	f.join(4,6,17); s = f.verify(); assert(!s, 'a7 ' + s);
	assert(f,'{[a b c d e f o p q r] [h i j k l m]}','a8');
	assert(f.toString(0xc),
			'{[((a:1 b:1 c:1) d:2 e:1) *f:3 ((o:1 p:1 -) q:2 r:1)] ' +
			 '[h:1 *i:2 (j:1 k:2 (- l:1 m:1))]}', 'a9');

	f.append(9,6); s = f.verify(); assert(!s, 'a10 ' + s);
	assert(f,'{[h i j k l m a b c d e f o p q r]}','a11');
	assert(f.toString(0xc),
			'{[(((h:1 i:2 j:1) k:2 l:1) m:3 ((a:1 b:1 c:1) d:2 e:1)) ' +
			 '*f:3 ((o:1 p:1 -) q:2 r:1)]}', 'a12');
	f.delete(6);
	assert(f.toString(0xc),
			'{[(((h:1 i:2 j:1) k:2 l:1) m:3 (a:1 b:2 (c:1 d:1 -))) *e:1 ' +
			  '((o:1 p:1 -) q:2 r:1)]}', 'a13');

	f.fromString('{[a b c d e] [h i j k] [l m n p q r]}');
	assert(f.toString(0xc),
			'{[(a:1 b:1 c:1) *d:2 e:1] [(- h:1 i:1) *j:2 k:1] ' +
			'[l:1 *m:2 ((- n:1 p:1) q:2 r:1)]}', 'b1');
	let key = new Float32Array(18);
	for (let i = 0; i <= 18; i++) key[i] = i;
	assert(f.search(9,10,key), 9, 'b2');

	key[15] = 10.5;
	f.insertByKey(15, 13, key);
	assert(f.toString(0xc),
			'{[(a:1 b:1 c:1) *d:2 e:1] [(- h:1 i:1) *j:2 k:1] ' +
			'[(o:1 l:1 -) *m:2 ((- n:1 p:1) q:2 r:1)]}', 'b3');

	f.insertAfter(10, 14);
	assert(f.toString(0xc),
			'{[(a:1 b:1 c:1) *d:2 e:1] ' +
			'[((o:1 l:1 m:1) n:2 (- h:1 i:1)) *j:2 (k:1 p:2 (q:1 r:1 -))]}',
			'b4');

	console.log('passed tests');
} catch(e) {
    if (e instanceof AssertError) {
		if (e.message.length != 0)
        	console.error(`${e.name}: ${e.message}`);
		else
			console.error(e.stack);
    } else {
        console.error(`${e.message}`);
		console.error(e.stack);
	}
}
