/** \file maxflow.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { EnableAssert as ea } from '../../../common/Assert.mjs';
import { Tester, Proceed } from '../../../common/Testing.mjs';
import maxflowHardcase from '../maxflowHardcase.mjs';
import maxflowFFsp from '../maxflowFFsp.mjs';
import maxflowD from '../maxflowD.mjs';
import maxflowDST from '../maxflowDST.mjs';
import maxflowFFmc from '../maxflowFFmc.mjs';
import maxflowFFcs from '../maxflowFFcs.mjs';
import maxflowPPf from '../maxflowPPf.mjs';
import maxflowPPhl from '../maxflowPPhl.mjs';
import flowfloor from '../flowfloor.mjs';
import maxflowVerify from '../maxflowVerify.mjs';
import List from '../../../dataStructures/basic/List.mjs';
import Flograph from '../../../dataStructures/graphs/Flograph.mjs';
import { randomFraction, randomInteger } from '../../../common/Random.mjs';
import { randomGraph, randomFlograph } from '../../misc/RandomGraph.mjs';

function run(g, trace, f) {
	if (g.hasFloors) throw new Proceed();
	g.clearFlow(); return f(g,trace);
}

function ff(g, trace) {
	if (!g.hasFloors) throw new Proceed();
	g.clearFlow();
	let [success, ts, stats] = flowfloor(g, trace);
	if (!success) throw new Proceed('cannot satisfy min flow requirements');
	return [ts, stats];
}

function verifyFloors(g) {
	for (let e = g.first(); e; e = g.next(e))
		if (g.flow(e) < g.floor(e))
			return 'floor spec not satisfied';
	return '';
}

let algomap = {
	'FFsp': ['maxflowFFsp', (g,trace)=>run(g,trace,maxflowFFsp), maxflowVerify],
	'D':    ['maxflowD',    (g,trace)=>run(g,trace,maxflowD),    maxflowVerify],
	'DST':  ['maxflowDST',  (g,trace)=>run(g,trace,maxflowDST),  maxflowVerify],
	'FFmc': ['maxflowFFmc', (g,trace)=>run(g,trace,maxflowFFmc), maxflowVerify],
	'FFcs': ['maxflowFFcs', (g,trace)=>run(g,trace,maxflowFFcs), maxflowVerify],
	'PPf':  ['maxflowPPf',  
			 (g,trace)=>run(g,trace,(g,trace)=>maxflowPPf(g,g.m,trace)),
			 maxflowVerify],
	'PPhl': ['maxflowPPhl',  
			 (g,trace)=>run(g,trace,(g,trace)=>maxflowPPhl(g,g.m,trace)),
			 maxflowVerify],
	'floor':['flowfloor',   (g,trace)=>ff(g,trace), verifyFloors]
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, algomap);

let g = new Flograph(); g.fromString(
			'{a->[b:5 d:6] b[c:3 d:7 g:3] c[d:1 e:5] d[e:2 f:1 g:3] ' +
			'e[f:1 g:3 h:4] f[e:1 g:2 h:3] g[e:3 f:2 h:1] ' +
			'h[f:3 i:4 j:5] i[g:5 j:6] ->j[]}');
tester.addTest('small graph', g);

g = randomFlograph(14, 5, 3, 1, 1);
g.randomCapacities(randomInteger, 5, 15);
tester.addTest('small random', g);

g = randomFlograph(102, 20, 20, 2, 2);
g.randomCapacities(randomInteger, 1, 999);
tester.addTest('medium random', g);

g = randomFlograph(502, 100, 100, 2, 2);
g.randomCapacities(randomInteger, 1, 99);
!ea && tester.addTest('large random', g);

g = maxflowHardcase(15, 15);
!ea && tester.addTest(`hardcase(15,15) n=${g.n} m=${g.m}`, g);
g = maxflowHardcase(30, 30);
!ea && tester.addTest(`hardcase(30,30) n=${g.n} m=${g.m}`, g);

g = new Flograph(); g.fromString(
	'{a->[b:3 d:2] b[c:3 d:2-7 g:3] c[d:1 e:5] d[e:2 f:1 g:3] ' +
	'e[f:1 g:3 h:1-4] f[e:1 g:2 h:3] g[e:3 f:2-7 h:1] ' +
	'h[f:3 i:4 j:2] i[g:2-5 j:6] ->j[]}');
tester.addTest('small graph with floors', g);

g = new Flograph(); g.fromString(
	'{a->[b:3 d:2] b[c:3 d:2-7@2 g:3] c[d:1 e:5] d[e:2 f:1 g:3] ' +
	'e[f:1 g:3 h:1-4@-1] f[e:1 g:2@-3 h:3] g[e:3 f:2-7@4 h:1] ' +
	'h[f:3 i:4@1 j:2] i[g:2-5 j:6] ->j[]}');
tester.addTest('small graph with floors and costs', g);

g = randomFlograph(14, 5, 3, 1, 1);
g.randomCapacities(randomInteger, 1, 19); g.randomFloors(randomInteger, 0, 1);
tester.addTest('small random with floors', g);

g = randomFlograph(202, 20, 20, 2, 2);
g.randomCapacities(randomInteger, 1, 99); g.randomFloors(randomInteger, 0, 2);
tester.addTest('medium random with floors', g);

if (!ea) {
	g = randomFlograph(1002, 100, 100, 2, 2);
	g.randomCapacities(randomInteger, 1, 99);
	g.randomFloors(randomInteger, 0, 7);
	tester.addTest('large random with floors', g);
}

tester.run();
