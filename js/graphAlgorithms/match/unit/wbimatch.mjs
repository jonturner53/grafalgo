/** \file wbimatch.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../../common/Errors.mjs';
import Tester from '../../../common/Tester.mjs';
import wbimatchF from '../wbimatchF.mjs';
import wbimatchH from '../wbimatchH.mjs';
import matchVerify from '../matchVerify.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import { randomBigraph } from '../../misc/RandomGraph.mjs';
import { randomInteger } from '../../../common/Random.mjs';

let algomap = {
	'F' : wbimatchF,
	'H' : wbimatchH
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, 'bimatch', algomap, null);
// add verify procedure later, when it's written for general graphs

let g = new Graph();
g.fromString('{a[f:3 g:2 j:1] b[h:2 g:3 i:6] c[f:1 i:6 j:-1] d[g:1 h:2 f:1] ' +
			 'e[h:2 i:5 j:3]}');
//tester.addTest('small graph', g);

g = randomBigraph(5, 3); g.randomWeights(randomInteger, 1, 9);
tester.addTest('small random', g);
g = randomBigraph(5, 3); g.randomWeights(randomInteger, 1, 9);
tester.addTest('small random 2', g);
g = randomBigraph(100, 5); g.randomWeights(randomInteger, 1, 99);
//tester.addTest('medium random', g);
g = randomBigraph(400, 20); g.randomWeights(randomInteger, 1, 99);
//tester.addTest('large random', g);

tester.run();
