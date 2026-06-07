/** \file bec.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { Tester } from '../../../common/Testing.mjs';
import { maxColor, floorIndex } from '../becCommon.mjs';
import randomCase from '../becRandomCase.mjs';
import hardCase from '../becHardCase.mjs';
import mdmatch from '../becMdmatch.mjs';
import pmatch from '../becPmatch.mjs';
import split from '../becSplit.mjs';
import verify from '../becVerify.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import { maxFloor } from '../becCommon.mjs';

let algomap = {
	'mdmatch' : ['mdmatch', mdmatch, verify ],
	'pmatch' : ['pmatch', pmatch, verify ],
	'split' : ['split', split, verify ]
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, algomap);

function shift([g,lb,ub]) {
	let fmax = maxFloor(g);
	for (let i in lb) lb[i] = Math.max(0,lb[i]-fmax);
	for (let i in ub) ub[i] = Math.max(0,ub[i]-fmax);
	return [g,lb,ub];
}

let lb; let ub; let n; let gap=1;
let g = Graph.fromString('{a[f:1 g:3 j:4] b[g:2 h:3 i:1] c[f:2 i:3 j:4] ' +
			 			 'd[f:4 h:2 j:3] e[h:1 i:2]}', 10, 20, 'floor', 0);
g.setBipartition(5);
tester.addTest('small graph', g);
//ni, id, no, reg, Bmax, Cmax, gap
n=8; gap=1; [g,lb,ub] = shift(randomCase(n,6,16,[1,1],6,8,gap));
tester.addTest(`small random (${n},6,16,[1,1],6,8,${gap}): [${lb}] [${ub}]`,
				g, gap);

n=64; gap=1; [g,lb,ub] = shift(randomCase(n,32,128,[1,1],32,35,gap));
tester.addTest(`medium random (${64},32,128,[1,1],32,35,${gap}): [${lb}] [${ub}]`,
				g, gap);

n=7; gap = 1;[g,lb,ub] = shift(hardCase(n, gap));
tester.addTest(`small hard (${n},${gap}): [${lb}] [${ub}]}`, g, gap);

gap = 1.34; [g,lb,ub] = shift(hardCase(n, gap));
tester.addTest(`small hard (${n},${gap}): [${lb}] [${ub}]}`, g, gap);

gap = 1.51; [g,lb,ub] = shift(hardCase(n, gap));
tester.addTest(`small hard (${n},${gap}): [${lb}] [${ub}]}`, g, gap);

n = 16; gap=1; [g,lb,ub] = shift(hardCase(n, gap));
tester.addTest(`medium hard (${n},${gap}): [${lb}] [${ub}]`, g, gap);

gap=1.21; [g,lb,ub] = shift(hardCase(n, gap));
tester.addTest(`medium hard (${n},${gap}): [${lb}] [${ub}]`, g, gap);

gap=1.34; [g,lb,ub] = shift(hardCase(n, gap));
tester.addTest(`medium hard (${n},${gap}): [${lb}] [${ub}]`, g, gap);

n=64; gap=1; [g,lb,ub] = shift(hardCase(n, gap));
tester.addTest(`large hard (${n},${gap}): [${lb}] [${ub}]`, g, gap);

tester.run();

