/** \file egc.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { Tester } from '../../../common/Testing.mjs';
import { assert, EnableAssert as ea } from '../../../common/Assert.mjs';
import simple from '../egcSimple.mjs';
import egcKKP1 from '../egcKKP1.mjs';
import egcKKP2 from '../egcKKP2.mjs';
import egcYM from '../egcYM.mjs';
import egcT1 from '../egcT1.mjs';
import egcT2 from '../egcT2.mjs';
import verify from '../egcVerify.mjs';
import EdgeGroups from '../EdgeGroups.mjs';
import egcRandomCase from '../egcRandomCase.mjs';

let algomap = {
	'simple' : ['simple ', simple, verify ],
	'kkp1' : ['KKP1 ', egcKKP1, verify ],
	'kkp2' : ['KKP2 ', egcKKP2, verify ],
	'ym' : ['YM ', egcYM, verify],
	't1' : ['T1 ', (eg,trace) => egcT1(eg,0,trace), verify ],
	't2' : ['T2 ', egcT2, verify]
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, algomap);

let eg = new EdgeGroups();
eg.fromString('{a[(f i l)A (g k)B (e)C] b[(i l)D (h j)E (g k)F] ' +
			   'c[(f h j)G (e)H (g h)I] d[(f i)J (e j)K (k l)L]}');
tester.addTest('small example', eg);

eg = egcRandomCase(4,3,12,3,3);
tester.addTest('small random (4,3,12,3,4)', eg);

eg = egcRandomCase(5,4,20,4,4);
tester.addTest('smallish random +0 (5,4,20,4,4)', eg);

eg = egcRandomCase(5,4,20,4,5);
tester.addTest('smallish random +1 (5,4,20,4,5)', eg);

eg = egcRandomCase(30,10,150,10,10);
tester.addTest('medium random +0 (30,10,150,10,10)', eg);

eg = egcRandomCase(30,10,150,10,12);
tester.addTest('medium random +2 (30,10,150,10,12)', eg);

if (!ea) {
	eg = egcRandomCase(60,20,1200,20,22);
	tester.addTest('medium large random (60,20,300,20,22)', eg);
	
	eg = egcRandomCase(80,30,400,30,33);
	tester.addTest('large random (80,30,400,30,33)', eg);

	eg = egcRandomCase(100,50,1000,50,55);
	tester.addTest('larger random (100,50,1000,50,55)', eg);
}

tester.run();
