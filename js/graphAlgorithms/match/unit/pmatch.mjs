/** \file pmatch.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../../common/Errors.mjs';
import Tester from '../../../common/Tester.mjs';
import priorityMatchO from '../priorityMatchO.mjs';
import wmatchE from '../wmatchE.mjs';
import wbimatchH from '../wbimatchH.mjs';
import matchVerify from '../matchVerify.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import { randomInteger, randomFill } from '../../../common/Random.mjs';
import { randomGraph, randomBigraph } from '../../misc/RandomGraph.mjs';

let algomap = {
	'O' : priorityMatchO,
}

// Just check it's a proper matching, not optimal. 
function verify(g,prior,algo,earlyStop,match) {
console.log(arguments[0],arguments[1],arguments[4]);
return match.verify(); }

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, 'priorityMatch', algomap);

let g = new Graph();
g.fromString('{a[b d f] b[a g] c[e h] d[a f] e[c f g] f[a d e] ' +
			 'g[b e h] h[c g]}');
let prio = new Int32Array(g.n+1);
let md = g.maxDegree();
for (let u = 1; u <= g.n; u++)
	if (g.degree(u) == md) prio[u] = 1;
tester.addTest('small graph max degree', g, prio, wmatchE, false);

g = randomGraph(16,5);
prio = new Int32Array(g.n+1);
for (let u = 1; u <= g.n; u++)
	if (g.degree(u) > 4) prio[u] = g.degree(u) - 4;
tester.addTest('small random graph', g, prio, wmatchE, false);
tester.addTest('small random graph, early stop',
				g, prio, wmatchE, true);

g = randomBigraph(8,5);
prio = new Int32Array(g.n+1);
for (let u = 1; u <= g.n; u++)
	if (g.degree(u) > 4) prio[u] = g.degree(u) - 4;
tester.addTest('small random bigraph', g, prio, wbimatchH, false);

g = randomGraph(100,20);
prio = new Int32Array(g.n+1);
randomFill(prio, randomInteger, 1, 10);
tester.addTest(`medium random graph (${g.n},${g.m})`,
				g, prio, wmatchE, false);

g = randomBigraph(50,20);
prio = new Int32Array(g.n+1);
randomFill(prio, randomInteger, 1, 10);
tester.addTest(`medium random bigraph (${g.n},${g.m})`,
				g, prio, wbimatchH, false);

g = randomGraph(500,50);
prio = new Int32Array(g.n+1);
randomFill(prio, randomInteger, 1, 50);
tester.addTest(`large random graph (${g.n},${g.m})`,
				g, prio, wmatchE, false);

g = randomBigraph(250,50);
prio = new Int32Array(g.n+1);
randomFill(prio, randomInteger, 1, 50);
tester.addTest(`large random bigraph (${g.n},${g.m})`,
				g, prio, wbimatchH, false);

tester.run();
