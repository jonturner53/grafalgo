/** \file dcs.mjs
 *
 *  @author Jon Turner
 *  @date 2024
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../../common/Assert.mjs';
import { Tester, Proceed } from '../../../common/Testing.mjs';
import bidcsF from '../bidcsF.mjs';
import wbidcsF from '../wbidcsF.mjs';
import dcsT from '../dcsT.mjs';
import dcsVerify from '../dcsVerify.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import { randomInteger } from '../../../common/Random.mjs';
import { randomGraph, randomBigraph } from '../../misc/RandomGraph.mjs';
import ListPair from '../../../dataStructures/basic/ListPair.mjs';

let algomap = {
	'F' : ['bidcsF',
			(g,hi,lo,trace) => {
				let [dcs,ts,stats] = bidcsF(g,hi,lo,trace);
				return [dcs,ts,stats];
			}, dcsVerify],
	'Fw' : ['wbidcsF',
			(g,hi,lo,trace) => {
				let [dcs,ts,stats] = wbidcsF(g,hi,lo,trace);
                return [dcs,ts,stats];
 			}, dcsVerify],
	'T' : ['dcsT',
			(g,hi,lo,trace) => {
				let [dcs,ts,stats] = dcsT(g,hi,lo,trace);
                return [dcs,ts,stats];
 			}, dcsVerify]
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let bipartite = (args.indexOf('bipartite') >= 0);
let tester = new Tester(args, algomap);

if (bipartite) {
	console.log('bipartite graphs');
	let g = new Graph();
	g.fromString('{a[f:3 g:2 j:1] b[h:2 g:3 i:6] c[f:1 i:6 j:-1] ' +
				  'd[g:1 h:2 f:1] e[h:2 i:5 j:3]}');
	let io = new ListPair();
	for (let u = 1; u <= 5; u++) io.swap(u);
	g.split(io);
	tester.addTest('small bigraph', g,  [0,2,3,3,2,3,3,2,2,3,2],
										[0,1,2,1,0,1,2,0,0,2,1]);

	g = randomBigraph(8, 4); g.randomWeights(randomInteger, 1, 9);
	let lo = new Int32Array(g.n+1); let hi = new Int32Array(g.n+1);
	for (let u = 1; u <= g.n; u++) {
		lo[u] = randomInteger(0,Math.max(0,Math.min(2,g.degree(u)-1)));
		hi[u] = randomInteger(lo[u], g.degree(u));
	}
	tester.addTest('small random bigraph (8,4)', g, hi, lo);

	g = randomBigraph(100, 3); g.randomWeights(randomInteger, 1, 99);
	lo = new Int32Array(g.n+1); hi = new Int32Array(g.n+1);
	for (let u = 1; u <= g.n; u++) {
		lo[u] = randomInteger(0,Math.max(0,Math.min(2,g.degree(u)-1)));
		hi[u] = randomInteger(lo[u], g.degree(u));
	}
	tester.addTest('medium random bigraph (100,3)', g, hi, lo);
	
	if (!ea) {
		g = randomBigraph(400, 3); g.randomWeights(randomInteger, 1, 999);
		lo = new Int32Array(g.n+1); hi = new Int32Array(g.n+1);
		for (let u = 1; u <= g.n; u++) {
			lo[u] = randomInteger(0,Math.max(0,Math.min(2,g.degree(u)-1)));
			hi[u] = randomInteger(lo[u], g.degree(u));
		}
		tester.addTest('large random bigraph (400,3)',g,hi,lo);
	
		g = randomBigraph(400, 50); g.randomWeights(randomInteger, 1, 999);
		tester.addTest('large/denser random bigraph (400,50,hi,lo)', g);
	}
} else {
	console.log('general graphs')
	let g = new Graph(); g.hasWeights = true;
	g.fromString('{a[b h j k] b[a f g j p] c[f m] d[g] e[f g i n] ' +
				 'f[b c e l o p] g[b d e k o] h[a] i[e] j[a b] ' +
				 'k[a g p] l[f o] m[c o p] n[e] o[f g l m] p[b f k m] }');
	tester.addTest('small graph', g, [0,2,2,2,1,3,3,3,1,1,2,1,1,3,1,2,2],
									 [0,1,0,1,1,1,2,1,0,0,1,0,0,1,0,1,2]);
	let wg = new Graph();
	wg.fromString('{a[b:3 h:1 j:3 k:3] b[a:3 f:2 g:1 j:3 p:2] c[f:1 m:1] ' +
				  'd[g:2] e[f:2 g:3 i:2 n:1] f[b:2 c:1 e:2 l:2 o:3 p:1] ' +
				  'g[b:1 d:2 e:3 k:1 o:1] h[a:1] i[e:2] j[a:3 b:3] ' +
				  'k[a:3 g:1 p:3] l[f:2 o:1] m[c:1 o:2 p:1] n[e:1] ' +
				  'o[f:3 g:1 l:1 m:2] p[b:2 f:1 k:3 m:1] }');
	tester.addTest('small graph with weights', wg,
								[0,2,2,2,1,3,3,3,1,1,2,1,1,3,1,2,2],
								[0,1,0,1,1,1,2,1,0,0,1,0,0,1,0,1,2]);
	
	g = randomGraph(26, 5);
	let lo = new Int32Array(g.n+1); let hi = new Int32Array(g.n+1);
	for (let u = 1; u <= g.n; u++) {
		lo[u] = randomInteger(0,Math.max(0,Math.min(2,g.degree(u)-1)));
		hi[u] = randomInteger(lo[u], g.degree(u));
	}
	tester.addTest('small random (26,5)', g, hi, lo);

	wg = new Graph(); wg.assign(g); wg.randomWeights(randomInteger,0,3);
	tester.addTest('small random with weights (26,5)', wg, hi, lo);
	
	g = randomGraph(50, 10); g.randomWeights(randomInteger,1,25);
	lo = new Int32Array(g.n+1); hi = new Int32Array(g.n+1);
	for (let u = 1; u <= g.n; u++) {
		lo[u] = randomInteger(0,Math.max(0,Math.min(2,g.degree(u)-1)));
		hi[u] = randomInteger(lo[u], g.degree(u));
	}
	tester.addTest('medium random (100,10)', g, hi, lo);
	
	if (!ea) {
		g = randomGraph(100, 10); g.randomWeights(randomInteger,1,50);
		lo = new Int32Array(g.n+1); hi = new Int32Array(g.n+1);
		for (let u = 1; u <= g.n; u++) {
			lo[u] = randomInteger(0,Math.max(0,Math.min(2,g.degree(u)-1)));
			hi[u] = randomInteger(lo[u], g.degree(u));
		}
		tester.addTest('large random sparse (100, 10)', g, hi, lo);
	}

}

tester.run();
