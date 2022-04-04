/** \file mstTest.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError } from '../../../common/Errors.mjs';
import Tester from '../../../common/Tester.mjs';
import mstP from '../mstP.mjs';
import mstPf from '../mstPf.mjs';
import mstK from '../mstK.mjs';
import mstCT from '../mstCT.mjs';
import mstVerify from '../mstVerify.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import { randomFraction, randomInteger } from '../../../common/Random.mjs';
import { randomGraph, randomConnectedGraph } from '../../misc/RandomGraph.mjs';

let algomap = {
	'P' : mstP,
	'Pf' : mstPf,
	'K' : mstK,
	'CT' : mstCT
}
let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args,'spt', algomap, mstVerify);

let g = new Graph(); g.fromString(
		'{a[b:3 d:2] b[a:3 c:7] c[b:7 d:1] d[a:2 c:1] ' +
	 	'e[f:1 g:3] f[e:1 g:2 h:3] g[e:3 f:2 h:1] i[j:5] j[i:5]}');
tester.addTest('small 3 component graph', g);

g = randomConnectedGraph(10, 3); g.randomWeights(randomInteger, 0, 99);
tester.addTest('small random graph', g);

g = randomGraph(1000, 20); g.randomWeights(randomFraction);
tester.addTest('large random graph', g);

tester.run();
