/** \file begc.mjs
 *
 *  @author Jon Turner
 *  @date 2025
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { Tester } from '../../../common/Testing.mjs';
import { assert, EnableAssert as ea } from '../../../common/Assert.mjs';
import egcRandomCase from '../egcRandomCase.mjs';
import { lowerBound } from '../egcCommon.mjs';
import egcCT from '../egcCT.mjs';
import {coreCT} from '../egcCT.mjs';
import egcKKPT from '../egcKKPT.mjs';
import egcYM from '../egcYM.mjs';
import {coreYM} from '../egcYM.mjs';
import egcTh from '../egcTh.mjs';
import verify from '../egcVerify.mjs';
import EdgeGroups from '../EdgeGroups.mjs';

let algomap = {
	'ct' : ['CT ', (eg,trace) => egcCT(eg,1,trace), verify],
	'kkpt' : ['KKPT ', egcKKPT, verify],
	'ym' : ['YM ', egcYM,verify],
	'thct' : ['ThCT ', (eg,trace) => egcTh(eg,coreCT,trace), verify],
	'thym' : ['ThYM ', (eg,trace) => egcTh(eg,coreYM,trace), verify]
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, algomap);

let eg = new EdgeGroups();
eg.fromString('{a[2(e k o p) 1(f g j m) 3(l)] b[1(e n o p) 3(h k) 2(m i l)] c[3(f) 1(h k g j m) 2(i l n)] d[1(e i o p) 2(f g h) 3(j n)]}');
tester.addTest('small example', eg);

eg = egcRandomCase(4,3,8,3,4,1,1);
tester.addTest('small random (4,3,12,3,4)', eg);

eg = egcRandomCase(5,4,15,4,4,1,1);
tester.addTest('smallish random (5,4,15,4,4)', eg);

eg = egcRandomCase(5,4,15,4,5,1,1);
tester.addTest('smallish random (5,4,15,4,5)', eg);

eg = egcRandomCase(5,4,15,4,5,3,1);
tester.addTest('smallish random (5,4,15,4,5,3,1,1)', eg);

eg = egcRandomCase(5,4,15,4,5,1,1,1.5);
tester.addTest('smallish random (5,4,15,4,5,1,1.5)', eg);

eg = egcRandomCase(30,10,150,10,10,1,1);
tester.addTest('medium random (30,10,150,10,10)', eg);

eg = egcRandomCase(30,10,150,10,12,1,1);
tester.addTest('medium random (30,10,150,10,12,1,1)', eg);

eg = egcRandomCase(30,10,150,10,12,3,1);
tester.addTest('medium random irregular +2,+3 (30,10,150,10,12,3)', eg);

eg = egcRandomCase(60,20,300,20,22,1,1);
tester.addTest('medium large random (60,20,300,20,22,1,1)', eg);

if (!ea) {
	eg = egcRandomCase(80,30,400,30,33,1,1);
	tester.addTest('large random (80,30,400,30,33,1,1)', eg);

	eg = egcRandomCase(100,50,1000,50,55,1,1);
	tester.addTest('larger random (100,50,1000,50,55,1,1)', eg);
}

tester.run();
