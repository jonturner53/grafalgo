/** \file bimatch.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../../common/Errors.mjs';
import Tester from '../../../common/Tester.mjs';
import bimatchF from '../bimatchF.mjs';
import bimatchHK from '../bimatchHK.mjs';
import matchVerify from '../matchVerify.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import { randomBigraph } from '../../misc/RandomGraph.mjs';

let algomap = {
	'F' : bimatchF,
	'HK' : bimatchHK
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, 'bimatch', algomap, matchVerify);

let g = new Graph();
g.fromString('{a[f g j] b[g h i] c[f i j] d[f h j] e[h i j]}');
tester.addTest('small graph', g);

g = randomBigraph(8, 3); tester.addTest('small random', g);
g = randomBigraph(1000, 3); tester.addTest('medium random', g);
g = randomBigraph(5000, 3); tester.addTest('large random', g);
g = randomBigraph(5000, 200); tester.addTest('large, dense random', g);

tester.run();
