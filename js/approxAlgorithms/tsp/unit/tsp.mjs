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
import { randomRegularGraph } from
		'../../../graphAlgorithms/misc/RandomGraph.mjs';
import tspVerify from '../tspVerify.mjs';
import tspRandom from '../tspRandom.mjs';
import tspC from '../tspC.mjs';
import {randomInteger, randomFraction} from '../../../common/Random.mjs';

let algomap = {
	'c' : ['tspC', tspC, tspVerify]
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, algomap);

let g = new Graph(); let tourLength = 0;
g.fromString('{ a[h:4 i:1] b[c:3 d:7 f:7 g:5] c[b:3 f:4] d[b:7 f:6 i:7 j:5 k:3] e[h:3 k:6 l:3] f[b:7 c:4 d:6 g:2] g[b:5 f:2 k:1] h[a:4 e:3] i[a:1 d:7 l:4] j[d:5 l:6] k[d:3 e:6 g:1] l[e:3 i:4 j:6] }');
tester.addTest('small graph (12,3):48', g);

[g,tourLength] = tspRandom(16,4,1,[randomInteger,1,9]);
tester.addTest('small random graph (16,4,1):'+tourLength, g);

[g,tourLength] = tspRandom(16,4,.5,[randomInteger,1,9]);
tester.addTest('small random graph (16,4,.5):'+tourLength, g);

[g,tourLength] = tspRandom(50,8,1,[randomInteger,1,50]);
tester.addTest('medium random graph (50,8,1):'+tourLength, g);

[g,tourLength] = tspRandom(50,8,.2,[randomInteger,1,50]);
tester.addTest('medium random graph (50,8,.2):'+tourLength, g);

[g,tourLength] = tspRandom(100,10,1,[randomInteger,1,100]);
tester.addTest('large random graph (100,10,1):'+tourLength, g);

[g,tourLength] = tspRandom(100,10,.1,[randomInteger,1,100]);
tester.addTest('large random graph (100,10,.1):'+tourLength, g);

tester.run();
