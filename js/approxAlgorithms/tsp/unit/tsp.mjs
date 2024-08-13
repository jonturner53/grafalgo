/** \file tsp.mjs
 *
 *  @author Jon Turner
 *  @date 2024
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { Tester } from '../../../common/Testing.mjs';
import { assert, EnableAssert as ea } from '../../../common/Assert.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import Digraph from '../../../dataStructures/graphs/Digraph.mjs';
import { randomRegularGraph } from
		'../../../graphAlgorithms/misc/RandomGraph.mjs';
import tspVerify from '../tspVerify.mjs';
import tspRandom from '../tspRandom.mjs';
import tspC from '../tspC.mjs';
import tspK from '../tspK.mjs';
import {randomInteger, randomFraction} from '../../../common/Random.mjs';

let algomap = {
	'c' : ['tspC', (g,seed,trace) => {
                        if (g instanceof Digraph) return null;
						return run(tspC, g ,seed, trace);
                        }, tspVerify],
	'k' : ['tspK', (g,seed,trace) => {
                        if (!(g instanceof Digraph)) return null;
						return run(tspK, g, seed, trace);
                        }, tspVerify]
}

function run(algo,g,seed,trace) {
	let rval = algo(g,trace);
	if (!rval) return null;
	let [tour,ts,stats] = rval;
	if (seed) {
		let len = 0; for (let e of seed) len += g.length(e);
		ts += `\nseed: ${g.elist2string(seed,0,0,1)} ` +
			  `${len}\n`;
	}
	return [tour,ts,stats];
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, algomap);

// symmetric test cases
let g = new Graph(); let seed; let seedLength;
g.fromString('{ a[h:4 i:1] b[c:3 d:7 f:7 g:5] c[b:3 f:4] d[b:7 f:6 i:7 j:5 k:3] e[h:3 k:6 l:3] f[b:7 c:4 d:6 g:2] g[b:5 f:2 k:1] h[a:4 e:3] i[a:1 d:7 l:4] j[d:5 l:6] k[d:3 e:6 g:1] l[e:3 i:4 j:6] }');
tester.addTest('small graph (12,3):48', g, seed);

[g,seed,seedLength] = tspRandom(16,4,1,[randomInteger,1,9]);
tester.addTest('small random graph (16,4,1):'+seedLength, g, seed);

[g,seed,seedLength] = tspRandom(16,4,.5,[randomInteger,1,9]);
tester.addTest('small random graph (16,4,.5):'+seedLength, g, seed);

[g,seed,seedLength] = tspRandom(50,8,1,[randomInteger,1,50]);
tester.addTest('medium random graph (50,8,1):'+seedLength, g, seed);

[g,seed,seedLength] = tspRandom(50,8,.2,[randomInteger,1,50]);
tester.addTest('medium random graph (50,8,.2):'+seedLength, g, seed);

[g,seed,seedLength] = tspRandom(100,10,1,[randomInteger,1,100]);
tester.addTest('large random graph (100,10,1):'+seedLength, g, seed);

[g,seed,seedLength] = tspRandom(100,10,.1,[randomInteger,1,100]);
tester.addTest('large random graph (100,10,.1):'+seedLength, g, seed);

// asymmetric test cases
g = new Digraph();
g.fromString('{a[d:5 g:8 i:3] b[e:4 g:6 j:7 k:6] c[d:1 f:3 h:3 i:9 l:1] d[b:1 h:6 l:7] e[a:3 k:4] f[e:1 g:6 h:5 k:3] g[c:4] h[b:9 j:5 l:4] i[h:2] j[d:5 e:1 f:4 g:5] k[a:1 d:4 f:4 g:4] l[f:5 j:1]}');
tester.addTest('small graph (12,4):32', g, null);

[g,seed,seedLength] = tspRandom(16,5,.35,[randomInteger,1,9],true);
tester.addTest('small random graph (16,5,.35):'+seedLength, g, seed);

[g,seed,seedLength] = tspRandom(50,15,1,[randomInteger,1,50],true);
tester.addTest('medium random graph (50,15,1):'+seedLength, g, seed);

[g,seed,seedLength] = tspRandom(50,15,.2,[randomInteger,1,50],true);
tester.addTest('medium random graph (50,15,.2):'+seedLength, g, seed);

[g,seed,seedLength] = tspRandom(100,30,1,[randomInteger,1,100],true);
tester.addTest('large random graph (100,30,1):'+seedLength, g, seed);

[g,seed,seedLength] = tspRandom(100,30,.05,[randomInteger,1,100],true);
tester.addTest('large random graph (100,30,.05):'+seedLength, g, seed);

tester.run();
