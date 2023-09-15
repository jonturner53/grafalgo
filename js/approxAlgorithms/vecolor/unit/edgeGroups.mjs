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

try {
	console.log('testing edgeGroups');

	let gg = new Graph();
	let eg = new EdgeGroups(gg);
	matches(eg.fromString('{a[(f i l) (g k) (e)] b[(i l) (h j) (g k)] ' +
						  'c[(f h j) (e) (g h)] d[(f i) (e j) (k l)]}'),
						  true, 'a0');
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
} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
