/** \file becolor.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { Tester } from '../../../common/Testing.mjs';
import { assert, EnableAssert as ea } from '../../../common/Assert.mjs';
import randomCase from '../randomCase.mjs';
import hardCase from '../hardCase.mjs';
import becolorPmatch from '../becolorPmatch.mjs';
import becolorSplit from '../becolorSplit.mjs';
import becolorVerify from '../becolorVerify.mjs';
import degreeBound from '../degreeBound.mjs';
import matchBound from '../matchBound.mjs';
import flowBound from '../flowBound.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import { randomSample } from '../../../common/Random.mjs';

let algomap = {
	'pmatch' : ['becolorPmatch', becolorPmatch, becolorVerify ],
	'split' : ['becolorSplit', becolorSplit, becolorVerify ]
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, algomap);


let g = new Graph();
g.fromString('{a[f:1 g:3 j:4] b[g:2 h:3 i:1] c[f:2 i:3 j:4] ' +
			 'd[f:4 h:2 j:3] e[h:1 i:2]}');
tester.addTest('small graph', g);

g = randomCase(8,5);
tester.addTest('small random (8,5,1,2)', g);

g = randomCase(100,20);
tester.addTest('medium random (100,20,1,4)', g);

g = hardCase(8);
tester.addTest('small hard (8)', g);

g = hardCase(16);
tester.addTest('medium hard (16)', g);

g = hardCase(64);
tester.addTest('large hard (64)', g);

tester.run();
