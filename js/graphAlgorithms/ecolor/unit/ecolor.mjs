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
g.fromString('{ a[e i i] b[j j] c[f g k] d[e g h]}');
g.setBipartition(4);
tester.addTest('small graph', g);

g = randomRegularBigraph(7, 3); tester.addTest('small random (7,3)', g);
g = randomRegularBigraph(13, 3); tester.addTest('smallish random (13,3)', g);
g = randomRegularBigraph(100, 31);
	tester.addTest('medium random (100,31)', g);
g = randomRegularBigraph(100, 32);
	tester.addTest('medium random even (100,32)', g);
if (!ea) {
	g = randomRegularBigraph(200, 63);
		tester.addTest('large random (200,63)', g);
	g = randomRegularBigraph(200, 64);
		tester.addTest('large random even (200,64)', g);
	g = randomRegularBigraph(400, 127);
		tester.addTest('larger random (400,127)', g);
	g = randomRegularBigraph(400, 128);
		tester.addTest('larger random even (400,128)', g);
	g = randomBigraph(400, 128);
		tester.addTest('larger random irregular (400,128)', g);
}

tester.run();
