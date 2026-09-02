/** \file fcolor.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { Tester } from '../../../common/Testing.mjs';
import simple from '../fcolorSimple.mjs';
import fcolorTl from '../fcolorTl.mjs';
import fcolorCT from '../fcolorCT.mjs';
import fcolorKKP from '../fcolorKKP.mjs';
import fcolorKKPT from '../fcolorKKPT.mjs';
import fcolorYM from '../fcolorYM.mjs';
import fcolorTh from '../fcolorTh.mjs';
import { coreCT } from '../fcolorCT.mjs';
import { coreYM } from '../fcolorYM.mjs';
import fcolorBsearch from '../fcolorBsearch.mjs';
import EGGraph from '../EGGraph.mjs';
import { randomGraph } from '../../../graphAlgorithms/misc/RandomGraph.mjs';
import { default as random } from '../randomEgc.mjs';
import { default as verify } from '../verifyEgc.mjs';

let algomap = {
	'simple' : ['simple ', simple, verify ],
	'tl' : ['Tl ', fcolorTl, verify],
	'ct' : ['CT ', (eg,trace) => fcolorCT(eg,trace), verify],
	'kkp' : ['KKP ', fcolorKKP, verify],
	'kkpt' : ['KKPT ', fcolorKKPT, verify],
	'ym' : ['YM ', fcolorYM, verify],
	'thct' : ['fcolorThCT ', (eg, trace) => fcolorTh(eg, coreCT, trace), verify],
	'thym' : ['fcolorThYM ', (eg, trace) => fcolorTh(eg, coreYM, trace), verify],
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let floors = (args.indexOf('floors') >= 0)
let tester = new Tester(args, algomap);

let egg = EGGraph.fromString('{a[(e k o p) (f g j m) (l)] ' +
							 'b[(e n o p) (h k) (m i l)] ' +
							 'c[(f) (h k g j m) (i l n)] ' +
							 'd[(e i o p) (f g h) (j n)]}');
tester.addTest('small example', egg);

[egg] = random(4,3,12,3,1, 0,4);
tester.addTest('small random (4,3,12,3,1, 0,4)', egg);

[egg] = random(5,4,15,4,1, 0,5);
tester.addTest('smallish random +0 (5,4,15,4,1,0,5)', eg);

/*
[egg] = random(5,4,15,4,1,5);
tester.addTest('smallish random +1 (5,4,15,4,1,5)', egg);

[egg] = random(5,4,15,4,[2,3],5);
tester.addTest('smallish random irregular +1 (5,4,15,4,[2,3],5)', egg);

[egg] = random(30,10,150,10,1,10);
tester.addTest('medium random +0 (30,10,150,10,1,10)', egg);

[egg] = random(30,10,150,10,1,12);
tester.addTest('medium random +2 (30,10,150,10,1,12)', egg);

[egg] = random(30,10,150,10,3,12);
tester.addTest('medium random irregular +2,+3 (30,10,150,10,3,12)', egg);

[egg] = random(60,20,300,20,1,22);
tester.addTest('medium large random (60,20,300,20,1,22)', egg);

if (!ea) {
	
	[egg] = random(80,30,400,30,1,33);
	tester.addTest('large random (80,30,400,30,1,33)', egg);

	[egg] = random(100,50,1000,50,1,55);
	tester.addTest('larger random (100,50,1000,50,1,55)', egg);
}
if (floors) {
}

*/
tester.run();
