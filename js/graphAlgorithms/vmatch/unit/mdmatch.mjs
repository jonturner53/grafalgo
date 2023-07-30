/** \file mdmatch.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../../common/Assert.mjs';
import { Tester, Proceed } from '../../../common/Testing.mjs';
import pmatchO from '../pmatchO.mjs';
import pmatchEGT from '../pmatchEGT.mjs';
import pbimatchHKT from '../pbimatchHKT.mjs';
import mdmatchG from '../mdmatchG.mjs';
import pmatchVerify from '../pmatchVerify.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import { randomInteger, randomFill, randomGeometric }
	from '../../../common/Random.mjs';
import { randomRegularBigraph } from '../../misc/RandomGraph.mjs';

import findSplit from '../../misc/findSplit.mjs';

let algomap = {
	'G' : ['mdmatchG',
			(g,prio,trace) => {
				let [match,ts,stats] = mdmatchG(g,trace);
				if (!match) throw new Proceed('not a bipartite graph');
				return [match,ts,stats];
			},
			(g,prio,match) => mdmatchVerify(g,match)],
	'HKT' : ['pbimatchHKT',
			  (g,prio,trace) => {
				let [match,ts,stats] = pbimatchHKT(g,prio,0,0,trace);
				if (!match) throw new Proceed('not a bipartite graph');
				return [match,ts,stats];
			},
			pmatchVerify],
	'HKTs' : ['pbimatchHKT:strict',
			  (g,prio,trace) => {
				let [match,ts,stats] = pbimatchHKT(g,prio,1,0,trace);
				if (!match) throw new Proceed('not a bipartite graph');
				return [match,ts,stats];
			},
			pmatchVerify],
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

function prettyRegularBigraph(n,d) {
	let g = randomRegularBigraph(n,d);
	for (let i = 1; i <= .2*n; i++) {
		let u = randomInteger(1,g.n);
		let e = g.firstAt(u);
		if (e) g.delete(e)
	}
	return g;
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, algomap);

let g = new Graph();
g.fromString('{a[f g h] b[e g] c[e h] d[e f h]}');
let prio = new Int32Array(g.n+1);
let md = g.maxDegree();
for (let u = 1; u <= g.n; u++)
	if (g.degree(u) == md) prio[u] = 1;
tester.addTest('small bigraph', g, prio);

g = prettyRegularBigraph(13,4);
prio = new Int32Array(g.n+1);
md = g.maxDegree();
for (let u = 1; u <= g.n; u++)
	if (g.degree(u) == md) prio[u] = 1;
tester.addTest(`small random bigraph (${g.n},${g.m})`, g, prio);

g = prettyRegularBigraph(100,3);
prio = new Int32Array(g.n+1);
md = g.maxDegree(); 
for (let u = 1; u <= g.n; u++)
	if (g.degree(u) == md) prio[u] = 1;
tester.addTest(`medium random bigraph (${g.n},${g.m})`, g, prio);

if (!ea) {
	g = prettyRegularBigraph(5000,3);
	prio = new Int32Array(g.n+1);
	md = g.maxDegree(); 
	for (let u = 1; u <= g.n; u++)
		if (g.degree(u) == md) prio[u] = 1;
	tester.addTest(`large random bigraph (${g.n},${g.m})`, g, prio);
}

tester.run();
