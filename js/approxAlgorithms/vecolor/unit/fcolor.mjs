/** \file fcolor.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { Tester } from '../../../common/Testing.mjs';
import { assert, assertEnabled as ae, disableAssert }
		from '../../../common/Assert.mjs';
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
import FanGraph from '../FanGraph.mjs';
import { lowerBounds, upperBounds } from '../common.mjs';
import { randomGraph } from '../../../graphAlgorithms/misc/RandomGraph.mjs';
import { default as random } from '../randomFcolor.mjs';
import verify from '../verify.mjs';

//disableAssert();

let algomap = {
	'simple' : ['simple ', simple, verify ],
	'tl' : ['Tl ', (g,trace) => fcolorTl(g,0,trace), verify],
	'ct' : ['CT ', fcolorCT, verify],
	'kkp' : ['KKP ', fcolorKKP, verify],
	'kkpt' : ['KKPT ', fcolorKKPT, verify],
	'ym' : ['YM ', fcolorYM, verify],
	'thct' : ['fcolorThCT ', (g, trace) => fcolorTh(g, coreCT, trace),verify],
	'thym' : ['fcolorThYM ', (g, trace) => fcolorTh(g, coreYM, trace),verify],
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tints = (args.indexOf('tints') >= 0)
let tester = new Tester(args, algomap);

let lb; let ub;
let g = FanGraph.fromString('{a[(e k o p) (f g j m) (l)] ' +
							 'b[(e n o p) (h k) (m i l)] ' +
							 'c[(f) (h k g j m) (i l n)] ' +
							 'd[(e i o p) (f g h) (j n)]}',
							  4, 10, 12, 40, 10 , 0);
lb = lowerBounds(g); ub = upperBounds(g);
tester.addTest(`small example (4,3,12,3,1): [${lb}] [${ub}]`, g);

[g,lb,ub] = random(4,3,12,3,1, 0,4);
tester.addTest(`small random (4,3,12,3,1, 0,4): [${lb}], [${ub}]`, g);

[g,lb,ub] = random(5,4,15,4,1, 0,5);
tester.addTest(`smallish random (5,4,15,4,1, 0,5): [${lb}], [${ub}]`, g);

[g,lb,ub] = random(5,4,15,4,[2,3,2], 0,5);
tester.addTest(`smallish random irregular (5,4,15,4,[2,3,2],5): ` +
				`[${lb}], [${ub}]`, g);

if (!ae()) {
	[g,lb,ub] = random(30,10,150,10,1, 0,10);
	tester.addTest(`medium random +0 (30,10,150,10,1, 0,10): ` +
	                `[${lb}], [${ub}]`, g);
	
	[g,lb,ub] = random(30,10,150,10,1, 0,12);
	tester.addTest(`medium random +2 (30,10,150,10,1, 0,12): ` +
	                `[${lb}], [${ub}]`, g);
	
	[g,lb,ub] = random(30,10,150,10,2, 0,12);
	tester.addTest(`medium random irregular (30,10,150,10,2, 0,12): ` +
	                `[${lb}], [${ub}]`, g);

	[g,lb,ub] = random(60,20,300,20,1, 0,22);
	tester.addTest(`medium large random (60,20,300,20,1, 0,22): ` +
                `[${lb}], [${ub}]`, g);

	[g,lb,ub] = random(80,30,400,30,1, 0,33);
	tester.addTest(`large random (80,30,400,30,1, 0,33): [${lb}], [${ub}]`, g);

	[g,lb,ub] = random(100,50,1000,50,1, 0,55);
	tester.addTest(`larger random (100,50,1000,50,1, 0,55): ` +
                `[${lb}], [${ub}]`, g);
}

if (tints) {
	g = FanGraph.fromString(
				'{a[2(e k o p) 1(f g j m) 3(l)] ' +
				 'b[1(e n o p) 3(h k) 2(m i l)] ' +
				 'c[3(f) 1(h k g j m) 2(i l n)] ' +
				 'd[1(e i o p) 2(f g h) 3(j n)]}',
				4, 12, 12, 40, 8, 1);
	lb = lowerBounds(g); ub = upperBounds(g);
	tester.addTest(`small example (4,3,12,3,1): [${lb}] [${ub}]`, g);
	
	[g,lb,ub] = random(4,3,12,3,1, 3,4);
	tester.addTest(`small random (4,3,12,3,1, 3,4): [${lb}], [${ub}]`, g);
	
	[g,lb,ub] = random(5,4,15,4,1, 4,4);
	tester.addTest(`smallish random (5,4,15,4,1, 4,4): [${lb}], [${ub}]`, g);
	
	[g,lb,ub] = random(5,4,15,4,1, 4,5);
	tester.addTest(`smallish random (5,4,15,4,1, 4,5): [${lb}], [${ub}]`, g);
	
	[g,lb,ub] = random(5,4,15,4,2, 5,6);
	tester.addTest(`smallish random (5,4,15,4,2, 5,6): [${lb}], [${ub}]`, g);
	
	[g,lb,ub] = random(5,4,15,4,1, 5,6);
	tester.addTest(`smallish random (5,4,15,4,1, 5,6): [${lb}], [${ub}]`, g);
	
	[g,lb,ub] = random(5,4,15,4,1, 6,6,1.5);
	tester.addTest(`smallish random (5,4,15,4,1, 6,6,1.5): ` +
                `[${lb}], [${ub}]`, g);
	
	[g,lb,ub] = random(30,10,150,10,1, 10,10);
	tester.addTest(`medium random (30,10,150,10,1, 10,10): ` +
                `[${lb}], [${ub}]`, g);
	
	if (!ae()) {
		[g,lb,ub] = random(30,10,150,10,1, 11,12);
		tester.addTest(`medium random (30,10,150,10,1, 11,12): ` +
	                `[${lb}], [${ub}]`, g);
		
		[g,lb,ub] = random(30,10,150,10,2, 11,12);
		tester.addTest(`medium random (30,10,150,10,2, 11,12): ` +
	                `[${lb}], [${ub}]`, g);
		
		[g,lb,ub] = random(30,10,150,10,1, 14,14,1.4);
		tester.addTest(`medium random (30,10,150,10,1, 14,14,1.4): ` +
	                `[${lb}], [${ub}]`, g);
		
		[g,lb,ub] = random(30,10,150,10,1, 14,17,1.4);
		tester.addTest(`medium random (30,10,150,10,1, 14,17,1.4): ` +
	                `[${lb}], [${ub}]`, g);
	
		[g,lb,ub] = random(60,20,300,20,1, 20,22);
		tester.addTest(`medium large random (60,20,300,20,1, 20,22): ` +
                `[${lb}], [${ub}]`, g);

		[g,lb,ub] = random(80,30,400,30,1, 30,33);
		tester.addTest(`large random (80,30,400,30,1, 30,33): ` +
                `[${lb}], [${ub}]`, g);
	
		[g,lb,ub] = random(100,50,1000,50,1, 50,55);
		tester.addTest(`larger random (100,50,1000,50,1, 50,55): ` +
                `[${lb}], [${ub}]`, g);
	}
}

tester.run();
