/** \file pmatch.mjs
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
import wmatchE from '../../match/wmatchE.mjs';
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
	'O' : ['pmatchO', (g,prio,trace) => pmatchO(g,prio,wmatchE,trace),
			pmatchVerify],
	'EGT' : ['pmatchEGT', (g,prio,trace) => pmatchEGT(g,prio,trace),
			 pmatchVerify]
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
let bipartite = (args.indexOf('bipartite') >= 0);
let tester = new Tester(args, algomap);

if (bipartite) {
	console.log('bipartite graphs');
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
	
	g = randomBigraph(100,3);
	let d = new Int32Array(g.n+1);
	for (let u = 1; u <= g.n; u++) d[u] = g.degree(u);
	g.sortAllEplists((e1,e2,v) => d[g.mate(v,e2)] - d[g.mate(v,e1)]);
	for (let u = 1; u <= g.n; u++) {
		while (d[u] > 4) { 
			let e = g.firstAt(u); d[u]--; d[g.mate(u,e)]--; g.delete(e);
		}
	}
	prio = new Int32Array(g.n+1);
	md = g.maxDegree(); 
	for (let u = 1; u <= g.n; u++) {
		if (g.degree(u) == md) prio[u] = 1;
	}
	tester.addTest(`medium random bigraph max degree (${g.n},${g.m})`, g, prio);
	
	g = randomBigraph(8,4,16);
	prio = new Int32Array(g.n+1); randomFill(prio, p => randomInteger(0,~~(g.n**.5)));
	tester.addTest(`small random bigraph (${g.n},${g.m},2)`, g, prio);
	
	g = randomBigraph(200,50,600);
	prio = new Int32Array(g.n+1); randomFill(prio, p => randomInteger(0,~~(g.n**.5)));
	tester.addTest(`medium random bigraph (${g.n},${g.m},3)`, g, prio);
	
	if (!ea) {
		g = randomBigraph(500,15,2500);
		prio = new Int32Array(g.n+1); randomFill(prio, p => randomInteger(0,~~(g.n**.5)));
		tester.addTest(`large random bigraph (${g.n},${g.m},5)`, g, prio);
	
		g = randomBigraph(500,15,2500);
		prio = new Int32Array(g.n+1); randomFill(prio, p => randomInteger(0,~~(g.n**.25)));
		tester.addTest(`large random bigraph with few classes (${g.n},${g.m},5)`, g, prio);
	
		g = randomBigraph(500,15,2500);
		prio = new Int32Array(g.n+1); randomFill(prio, p => randomInteger(0,~~(g.n**.75)));
		tester.addTest(`large random bigraph with many classes (${g.n},${g.m},5)`, g, prio);
	}
} else {
	console.log('general graphs');
	let g = new Graph();
	g.fromString('{a[b d f] b[a g] c[e h] d[a f] e[c f g] f[a d e] ' +
				 'g[b e h] h[c g]}');
	let md = g.maxDegree();
	let prio = new Int32Array(g.n+1);
	for (let u = 1; u <= g.n; u++)
		if (g.degree(u) == md) prio[u] = 1;
	tester.addTest('small graph max degree', g, prio);
	
	g = randomGraph(25,5);
	prio = new Int32Array(g.n+1); randomFill(prio, p => randomInteger(0,~~(g.n**.5)));
	tester.addTest('small random graph', g, prio);
	
	g = randomGraph(100,10);
	prio = new Int32Array(g.n+1); randomFill(prio, p => randomInteger(0,~~(g.n**.5)));
	tester.addTest(`medium random graph (${g.n},${g.m})`, g, prio);
	
	if (!ea) {
		g = randomGraph(500,3);
		prio = new Int32Array(g.n+1); randomFill(prio, p => randomInteger(0,~~(g.n**.5)));
		!ea && tester.addTest(`large sparse random graph (${g.n},${g.m})`, g, prio);
	
		g = randomGraph(500,200);
		prio = new Int32Array(g.n+1); randomFill(prio, p => randomInteger(0,~~(g.n**.5)));
		!ea && tester.addTest(`large dense random graph (${g.n},${g.m})`, g, prio);
	}
}

tester.run();
