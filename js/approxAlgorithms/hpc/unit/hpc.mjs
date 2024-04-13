/** \file hpc.mjs
 *
 *  @author Jon Turner
 *  @date 2024
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { Tester } from '../../../common/Testing.mjs';
import { assert, EnableAssert as ea } from '../../../common/Assert.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import { randomRegularGraph } from
		'../../../graphAlgorithms/misc/RandomGraph.mjs';
import hpcVerify from '../hpcVerify.mjs';
import hpcRandom from '../hpcRandom.mjs';
import hpcPAV from '../hpcPAV.mjs';
import hpcKT from '../hpcKT.mjs';

let algomap = {
	'pav' : ['pav ', (g,s,t,trace)=>hpcPAV(g,1,s,t,trace), hpcVerify],
	'kt' : ['kt ', (g,s,t,trace)=>hpcKT(g,2,s,t,trace), hpcVerify]
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, algomap);

let g = new Graph();
g.fromString('{a[b e j] b[c g h] c[d f j] d[e g i j] e[f h] f[g i] g[h] h[i] i[j] j[]}');
tester.addTest('small example - cycle', g, 0, 0);

tester.addTest('small example - free path', g, 7, 0);
tester.addTest('small example - pinned path', g, 7, 3);

g = randomRegularGraph(10,3);
tester.addTest('small cubic (10,3)', g, 0, 0);

g = hpcRandom(10,4);
tester.addTest('small (10,4) random', g, 0, 0);

g = hpcRandom(10,4,2,6);
tester.addTest('small (10,4) random - pinned path', g, 2, 6);

g = hpcRandom(100,20);
tester.addTest('medium (100,16) random', g, 0, 0);

g = hpcRandom(1000,25);
tester.addTest('large (1000,25) random', g, 0, 0);

tester.run();
