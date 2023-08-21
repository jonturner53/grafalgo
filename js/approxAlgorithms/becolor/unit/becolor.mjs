/** \file becolor.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { Tester } from '../../../common/Testing.mjs';
import { assert, EnableAssert as ea } from '../../../common/Assert.mjs';
import randomCase from '../randomCase.mjs';
import hardCase from '../hardCase.mjs';
import becolorPmatch from '../becolorPmatch.mjs';
import becolorSplit from '../becolorSplit.mjs';
import becolorVerify from '../becolorVerify.mjs';
import degreeBound from '../degreeBound.mjs';
import matchBound from '../matchBound.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import { randomSample } from '../../../common/Random.mjs';
import { randomBigraph,randomRegularBigraph }
		from '../../../graphAlgorithms/misc/RandomGraph.mjs';

let algomap = {
	'pmatch' : ['becolorPmatch',
				(g,trace)=>becolorPmatch(g,trace),
				(g,color) => {
					return becolorVerify(g,color);
				}],
	'split' : ['becolorSplit',
				(g,trace)=>becolorSplit(g,trace),
				(g,color) => {
					return becolorVerify(g,color);
				}]
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, algomap);

/** Generate a random regular test case.
 *  @param n is the number of vertices in each block of the bipartition
 *  @param d is the vertex degree
 *  @param gap is a number >= 1 that specifies the separation
 *  between consecutive bounds (the speedup in switching applications)
 *  @param extra is the number of extra bound values (in addition to
 *  the minimum of d) from which edge bounds are selected
 *  @return a graph with random bounds
function randomCase(n, d, gap=1, extra=0) {
	let g = randomRegularBigraph(n,d); g.addBounds();
	for (let u = 1; u <= n; u++) {
		let bu = randomSample(d+extra, d); let i = 1;
		for (let e = g.firstAt(u); e; e = g.nextAt(u,e))
			g.bound(e,1+gap*(bu[i++]-1));
	}
	return g;
}

function hardCase(n,gap=1) {
	let g = new Graph(3*n-1,n*n); g.addBounds();
	for (let u = 1; u <= n; u++) {
		for (let i = 1; i <= u; i++) {
			let e = g.join(u, n+i);
				g.bound(e, gap*(i-1)+1);
		}
		for (let i = u+1; i <= n; i++) {
			let e = g.join(u, 2*n+u); g.bound(e, gap*(i-1)+1);
		}
	}
	return g;
}
 */

let g = new Graph();
g.fromString('{a[f:1 g:3 j:4] b[g:2 h:3 i:1] c[f:2 i:3 j:4] ' +
			 'd[f:4 h:2 j:3] e[h:1 i:2]}');
tester.addTest('small graph', g);

g = randomCase(8,5);
tester.addTest('small random (8,5,1,2)', g);

g = randomCase(100,20);
tester.addTest('medium random (100,20,1,4)', g);

g = hardCase(8);
tester.addTest('small hard (8)', g);

g = hardCase(16);
tester.addTest('medium hard (16)', g);

g = hardCase(64);
tester.addTest('large hard (64)', g);

tester.run();
