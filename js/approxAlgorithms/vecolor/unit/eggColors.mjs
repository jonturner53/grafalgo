/** \file eggColors.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { AssertFail } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';
import EdgeGroupGraph from '../EdgeGroupGraph.mjs';
import eggColors from '../eggColors.mjs';

try {
	console.log('testing eggColors');

	let gg = new EdgeGroupGraph();
	matches(gg.fromString('{a[(f i l)A (g k)B (e)C] ' +
						  'b[(i l)D (h j)E (g k)F] ' +
						  'c[(f h j)G (e)H (g h)I] ' +
						  'd[(f i)J (e j)K (k l)L]}'),
						  true, 'a0');

	let gc = new eggColors(gg, 4);
	matches(gc.fromString( '{1[a(f i)A b(h j)E c(e)H d(k l)L] ' +
     						'2[a(g k)B b(i l)D c(h j)G d(f)J] ' +
     					 	'3[a(l)A b(g)F c(f)G d(e j)K] ' +
     						'4[a(e)C b(k)F c(g h)I d(i)J]}'),
						  	true, 'a1');

	matches(gc.toString(),'{\n1[a(f i)A b(h j) c(e) d(k l)]\n' +
     						 '2[a(g k) b(i l) c(h j)G d(f)J]\n' +
     						 '3[a(l)A b(g)F c(f)G d(e j)]\n' +
     						 '4[a(e) b(k)F c(g h) d(i)J]\n}\n', 'a2');

	matches(gc,'{1[a(f i)A b(h j)E c(e)H d(k l)L] ' +
    		    '2[a(g k)B b(i l)D c(h j)G d(f)J] ' +
     		    '3[a(l)A b(g)F c(f)G d(e j)K] ' +
     		    '4[a(e)C b(k)F c(g h)I d(i)J]}', 'a3');

	let e = gg.findEdge(9,1); gc.color(e,3);
	matches(gc,'{1[a(f)A b(h j)E c(e)H d(k l)L] ' +
    		    '2[a(g k)B b(i l)D c(h j)G d(f)J] ' +
     		    '3[a(l i)A b(g)F c(f)G d(e j)K] ' +
     		    '4[a(e)C b(k)F c(g h)I d(i)J]}', 'a4');
} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
