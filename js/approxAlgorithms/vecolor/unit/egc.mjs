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
import egcTl from '../egcTl.mjs';
import egcCT from '../egcCT.mjs';
import egcKKP from '../egcKKP.mjs';
import egcKKPT from '../egcKKPT.mjs';
import egcYM from '../egcYM.mjs';
import egcTh from '../egcTh.mjs';
import { coreCT } from '../egcCT.mjs';
import { coreYM } from '../egcYM.mjs';
import egcBsearch from '../egcBsearch.mjs';
import verify from '../egcVerify.mjs';
import EdgeGroups from '../EdgeGroups.mjs';
import egcRandomCase from '../egcRandomCase.mjs';

let algomap = {
	'simple' : ['simple ', simple, verify ],
	'tl' : ['Tl ', egcTl, verify],
	'ct' : ['CT ', (eg,trace) => egcCT(eg,0,trace), verify],
	'ctor' : ['CTor ', (eg,trace) => egcCT(eg,1,trace), verify],
	'kkp' : ['KKP ', egcKKP, verify],
	'kkpt' : ['KKPT ', egcKKPT, verify],
	'ym' : ['YM ', egcYM, verify],
	'thct' : ['egcThCT ', (eg, trace) => egcTh(eg, coreCT, trace), verify],
	'thym' : ['egcThYM ', (eg, trace) => egcTh(eg, coreYM, trace), verify],
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, algomap);

let eg = new EdgeGroups();

//eg = egcRandomCase(3,4,21,1,1, 5,4);
//console.log(eg.toString(1));
eg = egcRandomCase(40,20,40,15,1, 22,21);

/*
eg.fromString('{a[(e k o p) (f g j m) (l)] b[(e n o p) (h k) (m i l)] c[(f) (h k g j m) (i l n)] d[(e i o p) (f g h) (j n)]}');
tester.addTest('small example', eg);

eg = egcRandomCase(4,3,12,3,1,3);
tester.addTest('small random (4,3,12,3,1,4)', eg);

eg = egcRandomCase(5,4,15,4,1,4);
tester.addTest('smallish random +0 (5,4,15,4,1,4)', eg);

eg = egcRandomCase(5,4,15,4,1,5);
tester.addTest('smallish random +1 (5,4,15,4,1,5)', eg);

eg = egcRandomCase(5,4,15,4,3,5);
tester.addTest('smallish random irregular +1 (5,4,15,4,3,5)', eg);

eg = egcRandomCase(30,10,150,10,1,10);
tester.addTest('medium random +0 (30,10,150,10,1,10)', eg);

eg = egcRandomCase(30,10,150,10,1,12);
tester.addTest('medium random +2 (30,10,150,10,1,12)', eg);

eg = egcRandomCase(30,10,150,10,3,12);
tester.addTest('medium random irregular +2,+3 (30,10,150,10,3,12)', eg);

eg = egcRandomCase(60,20,300,20,1,22);
tester.addTest('medium large random (60,20,300,20,1,22)', eg);

if (!ea) {
	
	eg = egcRandomCase(80,30,400,30,1,33);
	tester.addTest('large random (80,30,400,30,1,33)', eg);

	eg = egcRandomCase(100,50,1000,50,1,55);
	tester.addTest('larger random (100,50,1000,50,1,55)', eg);
}

tester.run();
*/
