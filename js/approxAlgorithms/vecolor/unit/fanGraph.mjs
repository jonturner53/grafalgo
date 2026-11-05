/** \file fanGraph.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { AssertFail } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';
import FanGraph from '../FanGraph.mjs';

try {
	console.log('testing FanGraph');

	let g = FanGraph.fromString(
						'{a[(f i l) (g k) (e)] b[(i l) (h j) (g k)] ' +
						'c[(f h j) (e) (g h)] d[(f i) (e j) (k l)]}');
	matches(!!g, true, 'a0');
	matches(g.toString(), '{a[(f i l) (g k) (e)] b[(i l) (h j) (g k)] ' +
                           'c[(f h j) (e) (g h)] d[(f i) (e j) (k l)]}', 'a1');
	matches(g,'{a[(f i l)A (g k)B (e)C] b[(i l)D (h j)E (g k)F] ' +
               'c[(f h j)G (e)H (g h)I] d[(f i)J (e j)K (k l)L]}', 'a2');
	let f1 = g.fan(g.findFanEdge(10,7));
	let f2 = g.fan(g.findFanEdge(8,9));
	matches(g.fan2string(f1), '(f h j)', 'a3');
	g.merge(f1,f2);
	matches(g.fan2string(f1), '(f h j g)', 'a4');
	matches(g, '{a[(f i l) (g k) (e)] b[(i l) (h j) (g k)] ' +
				'c[(f h j g) (e)] d[(f i)J (e j)K (k l)L]}', 'a5');
		// explicit fan ids required at d, since old fan I is gone

	g.bind(1,1); g.bind(2,2); g.bind(3,3);
	g.bind(3,4); g.bind(2,5); g.bind(1,6);
	g.bind(1,7); g.bind(2,8); 
	g.bind(2,10); g.bind(1,11); g.bind(3,12);
	g.colorFromPalettes();
	matches(g.toString(0x8),   '{a[(f:1 i:1 l:1) (g:2 k:2) (e:3)] ' +
								'b[(i:3 l:3) (h:2 j:2) (g:1 k:1)] ' +
								'c[(f:0 h:1 j:1 g:0) (e:2)] ' +
								'd[(f:2 i:2) (e:1 j:0) (k:3 l:0)]}', 'b1');
	matches(g.complete(), false, 'b2');
	g.bind(4,7); g.bind(4,12);
	g.colorFromPalettes();
	matches(g.complete(), true, 'b3');

	g = FanGraph.fromString(
						'{a[2(f i l) (g k) (e)] b[(i l) (h j) (g k)] ' +
						'c[(f h j) 4(e) (g h)] d[(f i) 3(e j) (k l)]}',
						4, 8, 12, 24, 5, 1);
	matches(!!g, true, 'a6');
	matches(g.toString(), '{a[2(f i l) (g k) (e)] b[(i l) (h j) (g k)] ' +
                           'c[(f h j) 4(e) (g h)] d[(f i) 3(e j) (k l)]}','a7');

/* checking out distribution of random fanouts
	[g] = egcRandomCase(100,50,500);
	let stats = new Int32Array(31);
	for (let f = g.firstFan(); f; f = g.nextFan(f)) {
		if (g.fanout(f) < 30) stats[g.fanout(f)]++;
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
