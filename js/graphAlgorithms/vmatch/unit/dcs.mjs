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
import dcsGT from '../dcsGT.mjs';
import dcsVerify from '../dcsVerify.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import { randomInteger } from '../../../common/Random.mjs';
import { randomGraph, randomBigraph } from '../../misc/RandomGraph.mjs';
import ListPair from '../../../dataStructures/basic/ListPair.mjs';

let algomap = {
	'F' : ['bidcsF',
			(g,hi,lo,trace) => {
				if (!g.hasBipartition) return null;
				let [dcs,ts,stats] = bidcsF(g,hi,lo,trace);
				if (dcs == null)
					throw new Proceed('*** infeasible lower bounds')
				else return [dcs,ts,stats];
			},
			(g,hi,lo,dcs) => dcs ? dcsVerify(g,hi,lo,dcs) : true],
	'GT' : ['dcsGT',
			 (g,hi,lo,trace) => g.hasBipartition ? null : dcsGT(g,hi,lo,trace),
			dcsVerify]
}

function bounds(g) {
	let hi = new Int32Array(g.n+1); let lo = new Int32Array(g.n+1);
	for (let u = 1; u <= g.n; u++) {
		lo[u] = randomInteger(0,Math.max(0,Math.min(2,g.degree(u)-1)));
		hi[u] = randomInteger(lo[u], g.degree(u));
	}
	return [hi,lo];
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, algomap);

// bipartite graphs
let g = new Graph();
g.fromString('{a[f g j] b[h g i] c[f i j] d[g h f] e[h i j]}');
g.setBipartition();
let hi = [0,2,3,3,2,3,3,2,2,3,2];
tester.addTest('small bigraph with upper bounds', g, hi, 0);
let lo = [0,1,2,1,0,1,2,0,0,2,1];
tester.addTest('small bigraph with upper & lower bounds', g, hi, lo);

g = randomBigraph(10, 3); [hi,lo] = bounds(g);
tester.addTest('small random bigraph (10,3)', g, hi, lo);

g = randomBigraph(100, 5); [hi,lo] = bounds(g);
tester.addTest('medium random bigraph (100,5)', g, hi, lo);

if (!ea) {
	g = randomBigraph(400, 8); [hi,lo] = bounds(g);
	tester.addTest('large random bigraph (400,8)',g,hi,lo);

	g = randomBigraph(400, 50); [hi,lo] = bounds(g);
	tester.addTest('large/denser random bigraph (400,50,hi,lo)', g,hi,lo);
}

// weighted bigraphs
g.fromString('{a[f:3 g:2 j:1] b[h:2 g:3 i:6] c[f:1 i:6 j:-1] ' +
			  'd[g:1 h:2 f:1] e[h:2 i:5 j:3]}');
g.setBipartition(); [hi,lo] = bounds(g);
tester.addTest('small weighted bigraph', g, hi, lo);

g = new randomBigraph(10,3); [hi,lo] = bounds(g);
g.randomWeights(randomInteger,0,9);
tester.addTest('small random weighted bigraph (10,3)', g, hi, lo);

g = new randomBigraph(100,6); [hi,lo] = bounds(g);
g.randomWeights(randomInteger, 1, 99);
tester.addTest('medium random weighted bigraph (100,6)', g, hi, lo);

// general graphs
g = new Graph();
g.fromString('{a[b h j k] b[a f g j p] c[f m] d[g] e[f g i n] ' +
			 'f[b c e l o p] g[b d e k o] h[a] i[e] j[a b] ' +
			 'k[a g p] l[f o] m[c o p] n[e] o[f g l m] p[b f k m] }');
tester.addTest('small graph hi', g, [0,2,2,2,1,3,3,3,1,1,2,1,1,3,1,2,2], 0);
tester.addTest('small graph hi/lo',
						g,	[0,2,2,2,1,3,3,3,1,1,2,1,1,3,1,2,2],
							[0,1,0,1,1,1,2,1,0,0,1,0,0,1,0,1,2]);

g = randomGraph(26, 5); [hi,lo] = bounds(g);
tester.addTest('small random (26,5)', g, hi, lo);

// weighted general graphs
g = new Graph();
g.fromString('{a[b:3 h:1 j:3 k:3] b[a:3 f:2 g:1 j:3 p:2] c[f:1 m:1] ' +
			  'd[g:2] e[f:2 g:3 i:2 n:1] f[b:2 c:1 e:2 l:2 o:3 p:1] ' +
			  'g[b:1 d:2 e:3 k:1 o:1] h[a:1] i[e:2] j[a:3 b:3] ' +
			  'k[a:3 g:1 p:3] l[f:2 o:1] m[c:1 o:2 p:1] n[e:1] ' +
			  'o[f:3 g:1 l:1 m:2] p[b:2 f:1 k:3 m:1] }');
hi = [0,2,2,2,1,3,3,3,1,1,2,1,1,3,1,2,2];
lo = [0,1,0,1,1,1,2,1,0,0,1,0,0,1,0,1,2];
tester.addTest('small weighted graph hi/lo', g, hi, lo);

g = randomGraph(20, 4); [hi,lo] = bounds(g);
g.randomWeights(randomInteger,1,9);
tester.addTest('small weighted random (20,4) hi', g, hi, 0);

g = randomGraph(20, 4); [hi,lo] = bounds(g);
g.randomWeights(randomInteger,1,9);
tester.addTest('small weighted random (20,4) hi/lo', g, hi, lo);

g = randomGraph(50, 6); [hi,lo] = bounds(g);
g.randomWeights(randomInteger,1,19);
tester.addTest('medium weighted random (50,6) hi', g, hi, 0);

if (!ea) {
	g = randomGraph(100, 10); [hi,lo] = bounds(g);
	g.randomWeights(randomInteger,1,50);
	tester.addTest('large random weighted graph (100, 10) hi', g, hi, 0);
}

tester.run();
