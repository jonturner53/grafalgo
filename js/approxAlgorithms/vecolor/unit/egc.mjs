/** \file egc.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { Tester } from '../../../common/Testing.mjs';
import { assert, EnableAssert as ea } from '../../../common/Assert.mjs';
import layer from '../egcLayer.mjs';
import verify from '../egcVerify.mjs';
import EdgeGroups from '../EdgeGroups.mjs';
import egcRandomCase from '../egcRandomCase.mjs';

let algomap = {
	'layer' : ['layer ', (eg,trace) => layer(eg,0,trace), verify ],
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, algomap);

/* xxx */
let eg = new EdgeGroups();
eg.fromString('{a[(f i l)A (g k)B (e)C] b[(i l)D (h j)E (g k)F] ' +
			   'c[(f h j)G (e)H (g h)I] d[(f i)J (e j)K (k l)L]}');
eg.fromString('{ a[(g k e m o) (i l n) (p)] b[(f g k) (h j l m) (n p)] c[(e) (f i k l) (h j m o)] d[(e f h n) (g j p) (i o)] }');
tester.addTest('small example', eg);
tester.run();

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
	eg = egcRandomCase(60,20,300,20,22);
	tester.addTest('medium large random (60,20,300,20,22)', eg);
	
	eg = egcRandomCase(80,30,400,30,33);
	tester.addTest('large random (80,30,400,30,33)', eg);

	eg = egcRandomCase(100,50,1000,50,55);
	tester.addTest('larger random (100,50,1000,50,55)', eg);
}

