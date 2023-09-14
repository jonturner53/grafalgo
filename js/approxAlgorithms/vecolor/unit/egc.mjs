/** \file bec.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { Tester } from '../../../common/Testing.mjs';
import { assert, EnableAssert as ea } from '../../../common/Assert.mjs';
import basicLayer from '../egcBasicLayer.mjs';
import verify from '../egcVerify.mjs';
import EdgeGroupGraph from '../EdgeGroupGraph.mjs';
import {randomEdgeGroupGraph} 
		from '../../../graphAlgorithms/misc/RandomGraph.mjs';

let algomap = {
	'basicLayerStrict' : ['basic layer (strict)',
						  (egg,trace) => basicLayer(egg,1,trace), verify ],
	'basicLayer' : ['basic layer',
				    (egg,trace) => basicLayer(egg,0,trace), verify ]
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, algomap);

let egg = new EdgeGroupGraph();
egg.fromString('{a[(f i l)A (g k)B (e)C] b[(i l)D (h j)E (g k)F] ' +
			   'c[(f h j)G (e)H (g h)I] d[(f i)J (e j)K (k l)L]}');
tester.addTest('small graph', egg);

egg = randomEdgeGroupGraph(5,9,15,3,4);
tester.addTest('small random graph', egg);

tester.run();
