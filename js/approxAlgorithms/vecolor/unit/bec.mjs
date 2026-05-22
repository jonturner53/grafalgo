/** \file bec.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { Tester } from '../../../common/Testing.mjs';
import { assert, EnableAssert as ea } from '../../../common/Assert.mjs';
import { maxColor, floorIndex } from '../becCommon.mjs';
import randomCase from '../becRandomCase.mjs';
import hardCase from '../becHardCase.mjs';
import mdmatch from '../becMdmatch.mjs';
import pmatch from '../becPmatch.mjs';
import split from '../becSplit.mjs';
import verify from '../becVerify.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';

let algomap = {
	'mdmatch' : ['mdmatch', mdmatch, verify ],
	'pmatch' : ['pmatch', pmatch, verify ],
	'split' : ['split', split, verify ]
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, algomap);

let lb; let ub; let gap=1;
let g = Graph.fromString('{a[f:1 g:3 j:4] b[g:2 h:3 i:1] c[f:2 i:3 j:4] ' +
			 			 'd[f:4 h:2 j:3] e[h:1 i:2]}', 10, 20, 'floor', 0);
g.setBipartition(5);
tester.addTest('small graph', g);

//ni, id, no, reg, Bmax, Cmax, gap
gap=1; [g,lb,ub] = randomCase(6,5,15,[2,1.1],7,8,gap);
tester.addTest(`small random (6,5,15,[1,1.1],7,8,${gap}): [${lb}] [${ub}]`,
				g, gap);

gap=1.5; [g,lb,ub] = randomCase(6,5,15,[1,1],7,8,gap);
tester.addTest(`small random 2 (6,5,15,[2,2],7,8,${gap}): [${lb}] [${ub}]`,
				g,gap);

gap=1; [g,lb,ub] = randomCase(100,20,100,[1,1],24,26,gap);
tester.addTest(`medium random (100,20,100,[1,1],24,26,${gap}): ` +
				`[${lb}] [${ub}]`, g, gap);

let n = 7; gap=1;
[g,lb,ub] = hardCase(n, gap);
tester.addTest(`smallish hard (${n},${gap}): [${lb}] [${ub}]}`, g, gap);

gap = 1.29; [g,lb,ub] = hardCase(n, gap);
tester.addTest(`smallish hard (${n},${gap}): [${lb}] [${ub}]}`, g, gap);

gap = 1.51; [g,lb,ub] = hardCase(n, gap);
tester.addTest(`smallish hard (${n},${gap}): [${lb}] [${ub}]}`, g, gap);

gap=1; [g,lb,ub] = hardCase(16, gap);
tester.addTest(`medium hard (16,${gap}): [${lb}] [${ub}]`, g, gap);

gap=1; [g,lb,ub] = hardCase(64,gap);
tester.addTest(`large hard (64,${gap}): [${lb}] [${ub}]`, g, gap);

tester.run();
