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
	'pav10' : ['pav10 ', (g,s,t,trace)=>hpcPAV(g,10,s,t,trace), hpcVerify],
	'kt' : ['kt ', hpcKT, hpcVerify]
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, algomap);

let g = new Graph();
g.fromString('{a[b e j] b[c g h] c[d f j] d[e g i j] e[f h] f[g i] g[h] h[i] i[j] j[]}');
tester.addTest('small graph - cycle', g, 0, 0);

tester.addTest('small graph - free path', g, 7, 0);
tester.addTest('small graph - pinned path', g, 7, 3);

g = randomRegularGraph(10,3);
tester.addTest('small cubic graph (10,3)', g, 0, 0);

g = hpcRandom(10,4);
tester.addTest('small random graph (10,4)', g, 0, 0);

g = hpcRandom(10,4,2,6);
tester.addTest('small random graph (10,4) - pinned path', g, 2, 6);

g = hpcRandom(100,6);
tester.addTest('medium random graph (100,6)', g, 0, 0);

g = hpcRandom(200,10);
tester.addTest('large random graph (200,10)', g, 0, 0);

tester.run();
