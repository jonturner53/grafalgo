/** \file edgeGroups.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { AssertFail } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import EdgeGroups from '../EdgeGroups.mjs';
import egcRandomCase from '../egcRandomCase.mjs';

try {
	console.log('testing edgeGroups');

	let eg = EdgeGroups.fromString(
						'{a[(f i l) (g k) (e)] b[(i l) (h j) (g k)] ' +
						'c[(f h j) (e) (g h)] d[(f i) (e j) (k l)]}',
						12, 12, 4, 12);
	matches(!!eg, true, 'a0');
	matches(eg.toString(), '{a[(f i l) (g k) (e)] b[(i l) (h j) (g k)] ' +
                           'c[(f h j) (e) (g h)] d[(f i) (e j) (k l)]}', 'a1');
	matches(eg,'{a[(f i l)A (g k)B (e)C] b[(i l)D (h j)E (g k)F] ' +
               'c[(f h j)G (e)H (g h)I] d[(f i)J (e j)K (k l)L]}', 'a2');
	let g1 = eg.group(eg.findEdge(10,7));
	let g2 = eg.group(eg.findEdge(8,9));
	matches(eg.group2string(g1), '(f h j)', 'a3');
	eg.merge(g1,g2);
	matches(eg.group2string(g1), '(f h j g)', 'a4');
	matches(eg, '{a[(f i l) (g k) (e)] b[(i l) (h j) (g k)] ' +
				'c[(f h j g) (e)] d[(f i)J (e j)K (k l)L]}', 'a5');
		// explicit group ids required at d, since old group I is gone

	eg = EdgeGroups.fromString(
						'{a[2(f i l) (g k) (e)] b[(i l) (h j) (g k)] ' +
						'c[(f h j) 4(e) (g h)] d[(f i) 3(e j) (k l)]}',
						12, 12, 4, 12);
	matches(!!eg, true, 'a6');
	matches(eg.toString(), '{a[2(f i l) (g k) (e)] b[(i l) (h j) (g k)] ' +
                           'c[(f h j) 4(e) (g h)] d[(f i) 3(e j) (k l)]}','a7');

/* checking out distribution of random group fanouts
	[eg] = egcRandomCase(100,50,500);
	let stats = new Int32Array(31);
	for (let g = eg.firstGroup(); g; g = eg.nextGroup(g)) {
		if (eg.fanout(g) < 30) stats[eg.fanout(g)]++;
		else stats[30]++;
	}
	console.log('random(100,50,500) fanout stats:', stats);
*/
} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
