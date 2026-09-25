/** \file fanLayers.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { AssertFail } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';
import FanGraph from '../FanGraph.mjs';
import FanLayers from '../FanLayers.mjs';

try {
	console.log('testing FanLayers');

	let g = FanGraph.fromString(
						'{a[(f i l)A (g k)B (e)C] ' +
						 'b[(i l)D (h j)E (g k)F] ' +
						 'c[(f h j)G (e)H (g h)I] ' +
						 'd[(f i)J (e j)K (k l)L]}');
	matches(!!g, true, 'a0');

	let fl = new FanLayers(g, 3);
	fl.add(1,1); fl.add(5,1); fl.add(8,1); fl.add(12,1);
	fl.add(2,2); fl.add(4,2); fl.add(9,2); fl.add(11,2);
	fl.add(3,3); fl.add(6,3); fl.add(7,3); fl.add(10,3);
	matches(fl,'{[A E H L] [B D I K] [C F G J]}', 'a1');
	matches(fl.toString(1),
			'{\n[a(f i l) b(h j) c(e) d(k l)]\n' +
			'[a(g k) b(i l) c(g h) d(e j)]\n' +
			'[a(e) b(g k) c(f h j) d(f i)]\n}\n', 'a2');
	matches(fl.layer(9), 2, 'a3');
	fl.delete(9,2);
	matches(fl.layer(9), 0, 'a4');
} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
