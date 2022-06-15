/** \file ecolor.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Tester from '../../../common/Tester.mjs';
import ecolorV from '../ecolorV.mjs';
import ecolorG from '../ecolorG.mjs';
import ecolorVerify from '../ecolorVerify.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import { randomRegularBigraph } from '../../misc/RandomGraph.mjs';

let algomap = {
	'V' : ecolorV,
	'G' : ecolorG
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, 'ecolor', algomap, ecolorVerify);

let g = new Graph();
g.fromString('{a[f g j] b[g h i] c[f i j] d[f h j] e[h i]}');
tester.addTest('small graph', g);

g = randomRegularBigraph(7, 3); tester.addTest('small random', g);
g = randomRegularBigraph(100, 10); tester.addTest('medium random', g);
g = randomRegularBigraph(200, 63); tester.addTest('large random', g);
g = randomRegularBigraph(200, 64); tester.addTest('large even random', g);
g = randomRegularBigraph(400, 255); tester.addTest('larger random', g);
g = randomRegularBigraph(400, 256); tester.addTest('larger even random', g);

tester.run();
