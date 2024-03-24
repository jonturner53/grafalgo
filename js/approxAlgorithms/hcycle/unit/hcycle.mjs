/** \file hcycle.mjs
 *
 *  @author Jon Turner
 *  @date 2024
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { Tester } from '../../../common/Testing.mjs';
import { assert, EnableAssert as ea } from '../../../common/Assert.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import hcycleVerify from '../hcycleVerify.mjs';
import hcycleRandom from '../hcycleRandom.mjs';
import { randomRegularGraph } from
		'../../../graphAlgorithms/misc/RandomGraph.mjs';
import hcycleAV from '../hcycleAV.mjs';

let algomap = {
	'av' : ['av ', hcycleAV, hcycleVerify ]
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, algomap);

let [s,t] = [0,0];

let g = new Graph();
g.fromString('{a[b e j] b[c g h] c[d f j] d[e g i j] e[f h] f[g i] g[h] h[i] i[j] j[]}');
tester.addTest('small example - cycle', g, 0, 0);
tester.addTest('small example - free path', g, 7, 0);
tester.addTest('small example - pinned path', g, 7, 3);

g = randomRegularGraph(10,3);
tester.addTest('small cubic (10,3)', g, 0, 0);

g = hcycleRandom(10,25);
tester.addTest('small (10,25) random', g, 0, 0);

g = hcycleRandom(100,800);
tester.addTest('mediuum (100,800) random', g, 0, 0);

g = hcycleRandom(1000,13000);
tester.addTest('large (1000,13000) random', g, 0, 0);

tester.run();
