/** \file EdgeGroupLayers.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { AssertFail } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';
import EdgeGroups from '../EdgeGroups.mjs';
import EdgeGroupLayers from '../EdgeGroupLayers.mjs';

try {
	console.log('testing EdgeGroupLayers');

	let eg = new EdgeGroups();
	matches(eg.fromString('{a[(f i l)A (g k)B (e)C] ' +
						  'b[(i l)D (h j)E (g k)F] ' +
						  'c[(f h j)G (e)H (g h)I] ' +
						  'd[(f i)J (e j)K (k l)L]}'),
						  true, 'a0');

	let egl = new EdgeGroupLayers(eg, 3);
	egl.add(1,1); egl.add(5,1); egl.add(8,1); egl.add(12,1);
	egl.add(2,2); egl.add(4,2); egl.add(9,2); egl.add(11,2);
	egl.add(3,3); egl.add(6,3); egl.add(7,3); egl.add(10,3);
	matches(egl,'{[A E H L] [B D I K] [C F G J]}', 'a1');
	matches(egl.toString(1),
			'{\n[a(f i l) b(h j) c(e) d(k l)]\n' +
			'[a(g k) b(i l) c(g h) d(e j)]\n' +
			'[a(e) b(g k) c(f h j) d(f i)]\n}\n', 'a2');
	matches(egl.layer(9), 2, 'a3');
	egl.delete(9,2);
	matches(egl.layer(9), 0, 'a4');
} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
