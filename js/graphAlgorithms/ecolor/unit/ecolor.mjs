/** \file ecolor.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../../common/Errors.mjs';
import Tester from '../../../common/Tester.mjs';
import ecolorV from '../ecolorV.mjs';
import ecolorVerify from '../ecolorVerify.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import { randomRegularBigraph } from '../../misc/RandomGraph.mjs';

let algomap = {
	'V' : ecolorV
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, 'bimatch', algomap, ecolorVerify);

let g = new Graph();
g.fromString('{a[f g j] b[g h i] c[f i j] d[f h j] e[h i j]}');
tester.addTest('small graph', g);

g = randomRegularBigraph(7, 3); tester.addTest('small random', g);
g = randomRegularBigraph(1000, 10); tester.addTest('medium random', g);
g = randomRegularBigraph(1000, 50); tester.addTest('large random', g);

tester.run();
