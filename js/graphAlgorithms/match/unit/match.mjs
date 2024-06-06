/** \file wmatch.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../../common/Assert.mjs';
import { Tester, Proceed } from '../../../common/Testing.mjs';
import findSplit from '../../misc/findSplit.mjs';
import Matching from '../Matching.mjs';
import bimatchF from '../bimatchF.mjs';
import bimatchHK from '../bimatchHK.mjs';
import wbimatchH from '../wbimatchH.mjs';
import matchEG from '../matchEG.mjs';
import wmatchE from '../wmatchE.mjs';
import wmatchGMG from '../wmatchGMG.mjs';
import matchVerify from '../matchVerify.mjs';
import wmatchVerify from '../wmatchVerify.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import { randomInteger } from '../../../common/Random.mjs';
import { randomGraph, randomBigraph } from '../../misc/RandomGraph.mjs';
import ListPair from '../../../dataStructures/basic/ListPair.mjs';

function verify(g, match) {
	return g.hasWeights ? wmatchVerify(g,match) : matchVerify(g,match);
}

let algomap = {
	'F' : ['bimatchF',
			(g,trace) => {
				return g.bipartite ?  bimatchF(g,trace) : null;
			}, verify],
	'HK' : ['bimatchHK',
			(g,trace) => {
				return g.bipartite && !g.hasWeights ?
							bimatchHK(g,0,trace) : null;
 			}, matchVerify],
	'H' : ['wbimatchH',
			(g,trace) => {
				return g.bipartite && g.hasWeights ? wbimatchH(g,trace) : null;
 			}, wmatchVerify],
	'EG' : ['matchEG',
			 (g,trace) => {
				return !g.hasWeights ? matchEG(g,0,trace) : null;
			 }, matchVerify],
	'E' : ['wmatchE',
			 (g,trace) => {
				return g.hasWeights ? wmatchE(g,0,trace) : null;
			 }, wmatchVerify],
	'GMG' : ['wmatchGMG',
			 (g,trace) => {
				return g.hasWeights ? wmatchGMG(g,0,trace) : null;
			 }, wmatchVerify]
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, algomap);

// unweighted bigraphs
let g = new Graph();
g.fromString('{a[f g j] b[h g i] c[f i j] d[g h f] e[h i j]}');
g.fromString('{ a[o n q r] d[r t u w] e[r w n x] f[t y z o] g[r s t w] h[v w x y] i[p u x y] j[p q v n] k[u v y o] l[s t v z] m[q p o s] n[a e j] o[a f k m] p[i j m] q[a j m] r[a d e g] s[g l m] t[d f g l] u[d i k] v[h j k l] w[d e g h] x[e h i] y[f h i k] z[f l] }');
g.split();
tester.addTest('small bigraph', g);
tester.run();

g = randomBigraph(8, 3);
tester.addTest('small random bigraph (8,3)', g);

g = randomBigraph(100, 5);
tester.addTest('medium random bigraph (100,5)', g);

g = randomBigraph(400, 10);
tester.addTest('large random weighted bigraph (400,10)', g);
	
g = randomBigraph(400, 50);
tester.addTest('large/denser random weighted bigraph (400,50)', g);
	
// weighted bigraphs
g = new Graph();
g.fromString('{a[f:3 g:2 j:1] b[h:2 g:3 i:6] c[f:1 i:6 j:1] ' +
			  'd[g:1 h:2 f:1] e[h:2 i:5 j:3]}');
g.split();
tester.addTest('small weighted bigraph', g);

g = randomBigraph(8,3); g.randomWeights(randomInteger,1,9);
tester.addTest('small random weighted bigraph (8,3)', g);

g = randomBigraph(100, 3); g.randomWeights(randomInteger, 1, 99);
tester.addTest('medium random weighted bigraph (100,3)', g);
	
// unweighted general graphs
g = new Graph();
g.fromString('{a[b h j k] b[f g j p] c[f m] d[g] e[f g i n] f[l o p] ' +
			  'g[k o] k[a g] l[o] m[o p]}');
tester.addTest('small graph', g);

g = randomGraph(20,3);
tester.addTest('small random (20,3)', g);

g = randomGraph(100, 10);
tester.addTest('medium random (100,10)', g);

g = randomGraph(100, 30);
tester.addTest('medium random dense (100,30)', g);

if (!ea) {
	g = randomGraph(400, 5);
	tester.addTest('large random sparse (400,5)', g);
	
	g = randomGraph(400, 20);
	tester.addTest('large random (400,20)', g);
	
	g = randomGraph(400, 80);
	tester.addTest('large random dense (400,80)', g);
}

// weighted general graphs
g = new Graph();
g.fromString('{a[b:3 h:1 j:3 k:3] b[f:2 g:1 j:3 p:2] c[f:1 m:1] ' +
			  'd[g:2] e[g:3 i:2 n:1] f[l:2 o:3 p:1] g[k:1 o:1] ' +
			  'k[p:3] l[o:1] m[o:2 p:1] }');
tester.addTest('small weighted graph', g);

g = randomGraph(20,3); g.randomWeights(randomInteger,1,9);
tester.addTest('small random weighted (20,3)', g);

g = randomGraph(100,20); g.randomWeights(randomInteger,1,99);
tester.addTest('medium random weighted(100,20)', g);
if (!ea) {
	g = randomGraph(400, 5); g.randomWeights(randomInteger,1,99);
	tester.addTest('large random weighted sparse (400,5)', g);
	
	g = randomGraph(400, 20); g.randomWeights(randomInteger,1,99);
	tester.addTest('large random weighted (400,20)', g);
	
	g = randomGraph(400, 80); g.randomWeights(randomInteger,1,99);
	tester.addTest('large random dense (weighted 400,80)', g);
}

