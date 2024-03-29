/** \file spt.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { EnableAssert as ea } from '../../../common/Assert.mjs';
import { Tester, Proceed } from '../../../common/Testing.mjs';

import sptDag from '../sptDag.mjs';
import sptD from '../sptD.mjs';
import sptDf from '../sptDf.mjs';
import sptBM from '../sptBM.mjs';
import allpairsEK from '../allpairsEK.mjs';
import allpairsF from '../allpairsF.mjs';
import sptVerify from '../sptVerify.mjs';
import Digraph from '../../../dataStructures/graphs/Digraph.mjs';
import { randomFraction, randomInteger } from '../../../common/Random.mjs';
import { randomDigraph, randomDag } from '../../misc/RandomGraph.mjs';

function allpairsVerify(g, link, dist) {
	for (let s = 1; s <= g.n; s++) {
		let err = sptVerify(g, s, link[s], dist[s]);
		if (err.length > 0) return err;
	}
	return '';
}

let algomap = {
	'Dag' : ['sptDag',
					(g,trace) => {
						let [link,dist,ts,stats] = sptDag(g,1,trace);
						if (!link) throw new Proceed('*** not a dag');
						return [link,dist,ts,stats];
					}, (g,link,dist) => sptVerify(g,1,link,dist)],
	'D' : ['sptD', (g,trace) => {
						let [link,dist,ts,stats] = sptD(g,1,trace);
						if (!link) throw new Proceed('*** has negative edges');
						return [link,dist,ts,stats];
					}, (g,link,dist) => sptVerify(g,1,link,dist)],
	'Df' : ['sptDf', (g,trace) => {
						let [link,dist,ts,stats] = sptDf(g,1,trace);
						if (!link) throw new Proceed('*** has negative edges');
						return [link,dist,ts,stats];
					}, (g,link,dist) => sptVerify(g,1,link,dist)],
	'BM' : ['sptBM', (g,trace) => {
						let [link,dist,ts,stats] = sptBM(g,1,trace);
						if (!link) throw new Proceed('*** has negative cycle');
						return [link,dist,ts,stats];
					}, (g,link,dist) => sptVerify(g,1,link,dist)],
	'F' : ['allpairsF',
					(g,trace) => {
						let [link,dist,ts,stats] = allpairsF(g,trace);
						if (!link) throw new Proceed('*** has negative cycle');
						return [link,dist,ts,stats];
					}, (g,link,dist) => allpairsVerify(g,link,dist)],
	'EK' : ['allpairsEK',
					(g,trace) => {
						let [link,dist,ts,stats] = allpairsEK(g,trace);
						if (!link) throw new Proceed('*** has negative cycle');
						return [link,dist,ts,stats];
					}, (g,link,dist) => allpairsVerify(g,link,dist)]
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let acyclic = (args.indexOf('acyclic') >= 0);
let negative = (args.indexOf('negative') >= 0);
let tester = new Tester(args, algomap);

if (acyclic) {
	console.log('acyclic graphs');
	let g = randomDag(10, 3.5); g.randomLengths(randomInteger, 1, 9);
	tester.addTest('small random dag (10,3.5)', g);
	
	g = randomDag(200, 20); g.randomLengths(randomInteger, -100, 100);
	tester.addTest('medium random dag (200,20)', g);
	
	g = randomDag(2000, 200); g.randomLengths(randomInteger, -100, 100);
	tester.addTest('large random dag (2000,200)', g);
} else if (negative) {
	console.log('graphs with negative edges');
	let g = randomDigraph(10, 3.5); g.randomLengths(randomInteger, -15, 99);
	tester.addTest('small random graph (10,3.5)', g);
	
	g = randomDigraph(100, 5); g.randomLengths(randomInteger, -50, 999);
	tester.addTest('medium random graph (100,5)', g);
	
	g = randomDigraph(500, 30); g.randomLengths(randomInteger, -70, 5000);
	tester.addTest('large random graph (500,30)', g);
} else {
	console.log('graphs with non-negative edges');
	let g = new Digraph(); g.fromString(
			'{a[b:3 d:2 j:4] b[c:7 f:4 i:1] c[d:1 f:2 g:3] ' +
			'd[b:1 e:3] e[a:5 g:1] f[c:3 e:1 i:2]' +
			'g[b:2 h:2 j:1] h[i:1 e:1] i[c:3 f:1]' +
			'j[b:1 c:2 g:5]}');
	tester.addTest('small graph', g);
	
	g = randomDigraph(10, 3.5); g.randomLengths(randomInteger, 1, 99);
	tester.addTest('small random graph (10,3.5)', g);
	
	if (!ea) {
		g = randomDigraph(400, 20); g.randomLengths(randomFraction);
		tester.addTest('large random graph (400,20)', g);
	
		g = randomDigraph(800, 50); g.randomLengths(randomFraction);
		tester.addTest('larger random graph (800,50)', g);
	}
}

tester.run();
