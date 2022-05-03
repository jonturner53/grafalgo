/** \file mcflow.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../../common/Errors.mjs';
import Tester from '../../../common/Tester.mjs';
import maxflowD from '../../maxflow/maxflowD.mjs';
import mcflowK from '../mcflowK.mjs';
import mcflowKGT from '../mcflowKGT.mjs';
import mcflowLCP from '../mcflowLCP.mjs';
import mcflowS from '../mcflowS.mjs';
import maxflowVerify from '../../maxflow/maxflowVerify.mjs';
import mcflowVerify from '..//mcflowVerify.mjs';
import List from '../../../dataStructures/basic/List.mjs';
import Flograph from '../../../dataStructures/graphs/Flograph.mjs';
import { randomFraction, randomInteger } from '../../../common/Random.mjs';
import { randomGraph, randomFlograph } from '../../misc/RandomGraph.mjs';

function runK(g, trace) {
	let ts = '';
	g.clearFlow();
	maxflowD(g);
	if (trace) ts += g.toString(0,1);
	let [s,stats] = mcflowK(g, trace);
	return [ts+s, stats];
}

function runKGT(g, trace) {
	let ts = '';
	g.clearFlow();
	maxflowD(g);
	if (trace) ts += g.toString(0,1);
	let [s,stats] = mcflowKGT(g, trace);
	return [ts+s, stats];
}

function runLCP(g, trace) {
	let ts = '';
	g.clearFlow();
	mcflowK(g);  // eliminate negative cycles
	if (trace) ts += g.toString(0,1);
	let [s,stats] = mcflowLCP(g, trace);
	return [ts+s, stats];
}

function run(g, trace, f) { g.clearFlow(); return f(g,trace); }

let algomap = {
	'K' : (g,trace) => runK(g,trace),
	'KGT' : (g,trace) => runKGT(g,trace),
	'LCP' : (g,trace) => runLCP(g,trace),
	'S' : (g,trace) => run(g,trace,mcflowS)
}

function verify(g) {
	let err = maxflowVerify(g);
	if (err.length > 0) return err;
	return mcflowVerify(g);
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, 'mcflow', algomap, verify);

/*
let g = new Flograph(); g.fromString(
	'{a->[b:1,5 d:-1,6] b[c:3,3 d:1,7 g:2,3] c[d:2,1 e:1,5] ' +
	'd[b:2,3 e:1,2 f:2,1 g:1,3] ' +
	'e[f:-1,1 g:1,3 h:0,4] f[e:1,1 g:2,2 h:1,3] g[e:3,3 f:4,2 h:6,1] ' +
	'h[f:1,3 i:2,4 j:2,5] i[h:2,4 g:1,5 j:1,6] ->j[]}');
tester.addTest('small graph', g);

g = randomFlograph(14, 4, 3);
g.randomCapacities(randomInteger, 1, 9);
g.randomCosts(randomInteger, -9, 9);
tester.addTest(`small random (${g.n},${g.m})`, g);

g = randomFlograph(32, 10);
g.randomCapacities(randomInteger, 1, 99);
g.randomCosts(randomInteger, -99, 99);
tester.addTest(`medium random (${g.n},${g.m})`, g);

g = randomFlograph(62, 15);
g.randomCapacities(randomInteger, 1, 999);
g.randomCosts(randomInteger, -999, 999);
tester.addTest(`large random (${g.n},${g.m})`, g);
*/

let n=10; let d=3;
let g = randomFlograph(n,d);
g.randomCapacities(randomInteger, 1, 9);
g.randomCosts(randomInteger, -9, 9);
tester.addTest(`small random (${g.n},${g.m})`, g);

tester.run();
