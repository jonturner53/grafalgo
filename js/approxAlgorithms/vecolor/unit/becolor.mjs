/** \file becolor.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, assertEnabled as ae, disableAssert }
		from '../../../common/Assert.mjs';
import { Tester } from '../../../common/Testing.mjs';
import randomBecolor from '../randomBecolor.mjs';
import hardcase from '../hardcase.mjs';
import becolorMdmatch from '../becolorMdmatch.mjs';
import becolorPmatch from '../becolorPmatch.mjs';
import becolorSplit from '../becolorSplit.mjs';
import verify from '../verify.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';

//disableAssert();

let algomap = {
	'mdmatch' : ['mdmatch', becolorMdmatch, verify],
	'pmatch' : ['pmatch', becolorPmatch, verify],
	'split' : ['split', becolorSplit, verify]
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, algomap);


let g = Graph.fromString('{a[f:1 g:3 j:4] b[g:2 h:3 i:1] c[f:2 i:3 j:4] ' +
			 			 'd[f:4 h:2 j:3] e[h:1 i:2]}', 10, 20, ['tint',0]);
g.setBipartition(5);
tester.addTest('small graph', g);

let lb; let ub;
[g,lb,ub] = randomBecolor(8,5, 8,1, 5);
tester.addTest(`small random (8,5,8,1, 5): [${lb}], [${ub}]`, g);

[g,lb,ub] = randomBecolor(100,20,100,3, 25);
tester.addTest(`medium random (100,20,100,3, 25): [${lb}], [${ub}]`, g);

[g,lb,ub] = hardcase(8);
tester.addTest(`small hard (8): [${lb}], [${ub}]`, g);

[g,lb,ub] = hardcase(16);
tester.addTest(`medium hard (16): [${lb}], [${ub}]`, g);

if (!ae) {
	[g,lb,ub] = hardcase(64);
	tester.addTest(`large hard (64): [${lb}], [${ub}]`, g);
}

tester.run();
