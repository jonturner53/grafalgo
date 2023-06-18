/** \file pmatch.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../../common/Assert.mjs';
import { Tester, Proceed } from '../../../common/Testing.mjs';
import priorityMatchO from '../priorityMatchO.mjs';
import priorityBimatchHK from '../priorityBimatchHK.mjs';
import mdmatchG from '../mdmatchG.mjs';
import wmatchE from '../wmatchE.mjs';
import wbimatchH from '../wbimatchH.mjs';
import priorityMatchVerify from '../priorityMatchVerify.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import { randomInteger, randomFill, randomGeometric }
	from '../../../common/Random.mjs';
import { randomGraph, randomBigraph } from '../../misc/RandomGraph.mjs';

import findSplit from '../../misc/findSplit.mjs';

let algomap = {
	'G' : ['mdmatchG',
			(g,prio,trace) => {
				let [match,ts,stats] = mdmatchG(g,trace);
				if (!match) throw new Proceed('not a bipartite graph');
				return [match,ts,stats];
			},
			(g,prio,match) => mdmatchVerify(g,match)],
	'HK' : ['priorityBimatchHK',
			(g,prio,trace) => {
				let [match,ts,stats] = priorityBimatchHK(g,prio,0,trace);
				if (!match) throw new Proceed('not a bipartite graph');
				return [match,ts,stats];
			},
			priorityMatchVerify],
	'O' : ['priorityMatchO',
			(g,prio,trace) => priorityMatchO(g,prio,wmatchE,trace),
			priorityMatchVerify]
}

function mdmatchVerify(g,match) {
	let s = match.verify(); if (s) return s;
	let Delta = g.maxDegree();
	for (let u = 1; u <= g.n; u++) {
		if (g.degree(u) == Delta && !match.at(u))
			return `max degree vertex ${g.x2s(u)} not matched`;
	}
	return '';
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, algomap);

let g = new Graph();
g.fromString('{a[f g h] b[e g] c[e h] d[e f h]}');
let prio = new Int32Array(g.n+1);
let md = g.maxDegree();
for (let u = 1; u <= g.n; u++)
	if (g.degree(u) == md) prio[u] = 1;
tester.addTest('small bigraph max degree', g, prio);

g = randomBigraph(13,4);
prio = new Int32Array(g.n+1);
md = g.maxDegree();
for (let u = 1; u <= g.n; u++)
	if (g.degree(u) == md) prio[u] = 1;
tester.addTest(`small random bigraph max degree (${g.n},${g.m})`, g, prio);

g = randomBigraph(8,4,16);
prio = new Int32Array(g.n+1); randomFill(prio, p => randomGeometric(p)-1, .5);
tester.addTest(`small asymmetric random bigraph (${g.n},${g.m},2)`, g, prio);

g = randomBigraph(200,9,600);
prio = new Int32Array(g.n+1); randomFill(prio, p => randomGeometric(p)-1, .5);
tester.addTest(`medium random bigraph (${g.n},${g.m},3)`, g, prio);

if (!ea) {
	g = randomBigraph(500,15,2500);
	prio = new Int32Array(g.n+1); randomFill(prio, p => randomGeometric(p)-1, .5);
	tester.addTest(`large random bigraph (${g.n},${g.m},5)`, g, prio);
}

g = new Graph();
g.fromString('{a[b d f] b[a g] c[e h] d[a f] e[c f g] f[a d e] ' +
			 'g[b e h] h[c g]}');
md = g.maxDegree();
prio = new Int32Array(g.n+1);
for (let u = 1; u <= g.n; u++)
	if (g.degree(u) == md) prio[u] = 1;
tester.addTest('small graph max degree', g, prio);

g = randomGraph(25,3);
prio = new Int32Array(g.n+1); randomFill(prio, p => randomGeometric(p)-1, .5);
tester.addTest('small random graph', g, prio);

g = randomGraph(100,20);
prio = new Int32Array(g.n+1); randomFill(prio, p => randomGeometric(p)-1, .5);
tester.addTest(`medium random graph (${g.n},${g.m})`, g, prio);

if (!ea) {
	g = randomGraph(500,50);
	prio = new Int32Array(g.n+1); randomFill(prio, p => randomGeometric(p)-1, .5);
	!ea && tester.addTest(`large random graph (${g.n},${g.m})`, g, prio);
}

tester.run();
