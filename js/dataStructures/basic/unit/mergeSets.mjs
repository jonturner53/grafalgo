/** @file mergeSets.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { AssertFail } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';
import Scanner from '../Scanner.mjs';
import MergeSets from '../MergeSets.mjs';

try {
	console.log('testing MergeSets');
	let ds = new MergeSets(10);
	matches(ds, '{[j]}', 'a1');
	ds.merge(1, 3);
	matches(ds, '{[a c] [j]}', 'a2');
	ds.merge(4, 5); ds.merge(2, 4);
	matches(ds, '{[a c] [d b e] [j]}', 'a3');
	ds.merge(6, 7); ds.merge(8, 9); ds.merge(8, 10);
	matches(ds, '{[a c] [d b e] [f g] [h i j]}', 'a4');
	matches(ds.toString(0b1100),
			'{[a:1(c)] [d:1(b e)] [f:1(g)] [h:1(i j)]}', 'a5');
	ds.merge(1, 4); ds.merge(6, 8);
	matches(ds, '{[a b c d e] [f g h i j]}', 'a6');
	ds.merge(1, 6);
	matches(ds, '{[a b c d e f g h i j]}', 'a7');
	matches(ds.toString(0b1100), '{[a:3(c d:1(b e) f:2(g h:1(i j)))]}', 'a8');
	let r = ds.find(10);
	matches(ds.toString(0b1100), '{[a:3(c d:1(b e) f:2(g) h:1(i) j)]}', 'a9');
	matches(r, 1, 'a10');
	r = ds.find(2);
	matches(ds.toString(0b1100), '{[a:3(b c d:1(e) f:2(g) h:1(i) j)]}', 'a9');
	matches(r, 1, 'a12');

	matches(ds.fromString('{[a c] [d b e] [f g] [h i j]}'), true, 'a10');
} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
