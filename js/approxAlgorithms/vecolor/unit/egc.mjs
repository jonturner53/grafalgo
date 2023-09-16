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
import EdgeGroups from '../EdgeGroups.mjs';
import egcRandomCase from '../egcRandomCase.mjs';

let algomap = {
	'basicLayerStrict' : ['basic layer strict ',
						  (eg,trace) => basicLayer(eg,1,trace), verify ],
	'basicLayer' : ['basic layer ',
				    (eg,trace) => basicLayer(eg,0,trace), verify ]
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, algomap);

let eg = new EdgeGroups();
eg.fromString('{a[(f i l)A (g k)B (e)C] b[(i l)D (h j)E (g k)F] ' +
			   'c[(f h j)G (e)H (g h)I] d[(f i)J (e j)K (k l)L]}');
tester.addTest('small test case', eg);

eg = egcRandomCase(5,3,15,3,4);
tester.addTest('small random (5,3,15,3,4)', eg);

eg = egcRandomCase(30,10,90,10,12);
tester.addTest('medium random (30,10,90,10,12)', eg);

eg = egcRandomCase(100,50,1000,50,52);
tester.addTest('large random (100,50,1000,50,52)', eg);

tester.run();
