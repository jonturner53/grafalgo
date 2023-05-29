/** \file pbimatch.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../../common/Errors.mjs';
import Tester from '../../../common/Tester.mjs';
import wbimatchH from '../wbimatchH.mjs';
import priorityMatchO from '../priorityMatchO.mjs';
import priorityBimatchHK from '../priorityBimatchHK.mjs';
import matchVerify from '../matchVerify.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import { randomGeometric, randomFill } from '../../../common/Random.mjs';
import { randomGraph, randomBigraph } from '../../misc/RandomGraph.mjs';

let algomap = {
	'O' : (g,pri,trace) => priorityMatchO(g,pri,wbimatchH,0,trace),
	'HK' : priorityBimatchHK
}

// Just check it's a proper matching, not optimal. 
function verify(g,prior,algo,earlyStop,match) {
console.log(arguments[0],arguments[1],arguments[4]);
return match.verify(); }

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, 'priorityMatch', algomap);

let g = new Graph();
g.fromString('{a[f g h] b[e g] c[e h] d[e f h]}');
let prio = new Int32Array(g.n+1);
let md = g.maxDegree();
for (let u = 1; u <= g.n; u++)
	if (g.degree(u) == md) prio[u] = 1;
tester.addTest('small graph max degree', g, prio);

g = randomBigraph(8,4,16);
prio = new Int32Array(g.n+1); randomFill(prio, p => randomGeometric(p)-1, .5);
tester.addTest(`small random graph (${g.n},${g.m},2)`, g, prio);

g = randomBigraph(200,9,600);
prio = new Int32Array(g.n+1); randomFill(prio, p => randomGeometric(p)-1, .5);
tester.addTest(`medium random graph (${g.n},${g.m},3)`, g, prio);

g = randomBigraph(500,15,2500);
prio = new Int32Array(g.n+1); randomFill(prio, p => randomGeometric(p)-1, .5);
tester.addTest(`large random graph (${g.n},${g.m},5)`, g, prio);

tester.run();
