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
import pmatchVerify from '../pmatchVerify.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import { randomInteger, randomFill, randomGeometric }
	from '../../../common/Random.mjs';
import { randomGraph, randomBigraph, randomRegularGraph }
	from '../../misc/RandomGraph.mjs';

import findSplit from '../../misc/findSplit.mjs';

let algomap = {
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
	'O' : ['pmatchO', (g,prio,trace) => pmatchO(g,prio,trace), pmatchVerify],
	'EGT' : ['pmatchEGT', (g,prio,trace) => pmatchEGT(g,prio,trace),
			 pmatchVerify]
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let bipartite = (args.indexOf('bipartite') >= 0);
let tester = new Tester(args, algomap);

if (bipartite) {
	console.log('bipartite graphs');
	let g = new Graph(); g.split();
	let prio = [0,1,3,0,3,2,3,0,0,1,2];
	tester.addTest('small bigraph (8,11)', g, prio);
	
	g = randomBigraph(8,4,16);
	prio = new Int32Array(g.n+1);
	randomFill(prio, p => randomInteger(0,~~(g.n**.5)));
	tester.addTest(`small random bigraph (${g.n},${g.m},2)`, g, prio);
	
	g = randomBigraph(200,50,600);
	prio = new Int32Array(g.n+1);
	randomFill(prio, p => randomInteger(0,~~(g.n**.5)));
	tester.addTest(`medium random bigraph (${g.n},${g.m},3)`, g, prio);
	
	if (!ea) {
		g = randomBigraph(500,15,2500);
		prio = new Int32Array(g.n+1);
		randomFill(prio, p => randomInteger(0,~~(g.n**.5)));
		tester.addTest(`large random bigraph (${g.n},${g.m},5)`, g, prio);
	
		g = randomBigraph(500,15,2500);
		prio = new Int32Array(g.n+1);
		randomFill(prio, p => randomInteger(0,~~(g.n**.25)));
		tester.addTest(`large random bigraph with few classes ` +
					   `(${g.n},${g.m},5)`, g, prio);
	
		g = randomBigraph(500,15,2500);
		prio = new Int32Array(g.n+1);
		randomFill(prio, p => randomInteger(0,~~(g.n**.75)));
		tester.addTest(`large random bigraph with many classes ` +
					   `(${g.n},${g.m},5)`, g, prio);
	}
} else {
	console.log('general graphs');
	let g = new Graph();
	g.fromString('{a[b d f] b[a g] c[e h] d[a f] e[c f g] f[a d e] ' +
				 'g[b e h] h[c g]}');
	let prio = [0,1,2,0,3,0,3,0,2,0,2];
	tester.addTest('small graph', g, prio);
	
	g = randomRegularGraph(25,4);
	prio = new Int32Array(g.n+1);
	randomFill(prio, p => randomInteger(0,2));
	tester.addTest('small random graph (25,4)', g, prio);
	
	let wg = new Graph(); wg.assign(g);
	wg.randomWeights(randomInteger,0,3);
	tester.addTest('small random graph with weights (25,4)', wg, prio);
	
	g = randomGraph(100,10);
	prio = new Int32Array(g.n+1);
	randomFill(prio, p => randomInteger(0,~~(g.n**.5)));
	tester.addTest(`medium random graph (${g.n},${g.m})`, g, prio);
	
	if (!ea) {
		g = randomGraph(500,3);
		prio = new Int32Array(g.n+1);
		randomFill(prio, p => randomInteger(0,~~(g.n**.5)));
		!ea && tester.addTest(`large sparse random graph` +
							  ` (${g.n},${g.m})`, g, prio);
	
		g = randomGraph(500,200);
		prio = new Int32Array(g.n+1);
		randomFill(prio, p => randomInteger(0,~~(g.n**.5)));
		!ea && tester.addTest(`large dense random graph` +
					   		  ` (${g.n},${g.m})`, g, prio);
	}
}

tester.run();
