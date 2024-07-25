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
	'pav' : ['pav ', (g,s,t,trace)=>run(hpcPAV,g,1,s,t,trace), hpcVerify],
	'pav10' : ['pav10 ', (g,s,t,trace)=>run(hpcPAV,g,10,s,t,trace), hpcVerify],
	'kt' : ['kt ', (g,s,t,trace)=>run(hpcKT,g,0,s,t,trace), hpcVerify]
}

function run(algo,g,maxSelect,s,t,trace) {
	for (let i = 1; i <= 15; i++) {
		let [path,ts,stats] = maxSelect ? algo(g,maxSelect,s,t,trace) :
										  algo(g,s,t,trace);
		if (path || i == 15) return [path,ts,stats];
	}
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, algomap);

let g = new Graph();
g.fromString('{a[b e j] b[c g h] c[d f j] d[e g i j] e[f h] f[g i] g[h] h[i] i[j] j[]}');
tester.addTest('small graph - cycle', g, 0, 0);

tester.addTest('small graph - free path', g, 7, 0);
tester.addTest('small graph - pinned path', g, 7, 3);

g = randomRegularGraph(10,4);
tester.addTest('small cubic graph (10,4)', g, 0, 0);

g = hpcRandom(10,5);
tester.addTest('small random graph (10,5)', g, 0, 0);

g = hpcRandom(10,5,2,6);
tester.addTest('small random graph (10,5) - pinned path', g, 2, 6);

g = hpcRandom(50,10);
tester.addTest('medium random graph (50,10)', g, 0, 0);

g = hpcRandom(100,15);
tester.addTest('large random graph (100,15)', g, 0, 0);

tester.run();
