/** \file eggLayers.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { AssertFail } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';
import EdgeGroupGraph from '../EdgeGroupGraph.mjs';
import EggLayers from '../EggLayers.mjs';

try {
	console.log('testing eggLayers');

	let gg = new EdgeGroupGraph();
	matches(gg.fromString('{a[(f i l)A (g k)B (e)C] ' +
						  'b[(i l)D (h j)E (g k)F] ' +
						  'c[(f h j)G (e)H (g h)I] ' +
						  'd[(f i)J (e j)K (k l)L]}'),
						  true, 'a0');

	let eggl = new EggLayers(gg, 3);
	eggl.add(1,1); eggl.add(5,1); eggl.add(8,1); eggl.add(12,1);
	eggl.add(2,2); eggl.add(4,2); eggl.add(9,2); eggl.add(11,2);
	eggl.add(3,3); eggl.add(6,3); eggl.add(7,3); eggl.add(10,3);
	matches(eggl,'{[A E H L] [B D I K] [C F G J]}', 'a1');
	matches(eggl.toString(1),
			'{[(f i l)A (h j)E (e)H (k l)L] ' +
			'[(g k)B (i l)D (g h)I (e j)K] ' +
			'[(e)C (g k)F (f h j)G (f i)J]}', 'a1');
} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
