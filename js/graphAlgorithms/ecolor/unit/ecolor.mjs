/** \file ecolor.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { Tester } from '../../../common/Testing.mjs';
import { EnableAssert as ea } from '../../../common/Assert.mjs';
import ecolorR from '../ecolorR.mjs';
import ecolorG from '../ecolorG.mjs';
import ecolorVerify from '../ecolorVerify.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import { randomBigraph,randomRegularBigraph } from '../../misc/RandomGraph.mjs';

let algomap = {
	'R' : ['ecolorR', ecolorR, ecolorVerify],
	'G' : ['ecolorG', ecolorG, ecolorVerify]
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, algomap);

let g = new Graph();
g.fromString('{a[f g j] b[g h i] c[f i j] d[f h j] e[h i]}');
tester.addTest('small graph', g);

g = randomRegularBigraph(7, 5); tester.addTest('small random (7,5)', g);
g = randomRegularBigraph(13, 3); tester.addTest('smallish random (13,3)', g);
g = randomRegularBigraph(100, 63);
	tester.addTest('medium random (100,63)', g);
g = randomRegularBigraph(100, 64);
	tester.addTest('medium random even (100,64)', g);
if (!ea) {
	g = randomRegularBigraph(200, 127);
		tester.addTest('large random (200,127)', g);
	g = randomRegularBigraph(200, 128);
		tester.addTest('large random even (200,128)', g);
	g = randomRegularBigraph(400, 255);
		tester.addTest('larger random (400,255)', g);
	g = randomRegularBigraph(400, 256);
		tester.addTest('larger random even (400,256)', g);
	g = randomBigraph(400, 256);
		tester.addTest('larger random irregular (400,256)', g);
}

tester.run();
