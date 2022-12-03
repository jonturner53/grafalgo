/** \file wmatch.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../../common/Errors.mjs';
import Tester from '../../../common/Tester.mjs';
import Matching from '../Matching.mjs';
import wmatchE from '../wmatchE.mjs';
import wmatchGMG from '../wmatchGMG.mjs';
import matchVerify from '../matchVerify.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import { randomInteger } from '../../../common/Random.mjs';
import { randomGraph } from '../../misc/RandomGraph.mjs';

let algomap = {
	'E' : wmatchE,
	'GMG' : wmatchGMG
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, 'wmatch', algomap);

let g = new Graph(); g.addWeights();
g.fromString('{ a[b:3 h:1 j:3 k:3] b[a:3 f:2 g:1 j:3 p:2] c[f:1 m:1] d[g:2] e[f:2 g:3 i:2 n:1] f[b:2 c:1 e:2 l:2 o:3 p:1] g[b:1 d:2 e:3 k:1 o:1] h[a:1] i[e:2] j[a:3 b:3] k[a:3 g:1 p:3] l[f:2 o:1] m[c:1 o:2 p:1] n[e:1] o[f:3 g:1 l:1 m:2] p[b:2 f:1 k:3 m:1] }');
//tester.addTest('small graph', g);

//g = randomGraph(26, 5); g.randomWeights(randomInteger,1,9);
//tester.addTest('small random (26, 5) ', g);

g = randomGraph(100, 20); g.randomWeights(randomInteger,1,999);
tester.addTest('medium random (100, 20)', g);

g = randomGraph(100, 80); g.randomWeights(randomInteger,1,999);
tester.addTest('medium random dense (100, 80)', g);

g = randomGraph(400, 5); g.randomWeights(randomInteger,1,9999);
tester.addTest('large random sparse (400, 5)', g);

g = randomGraph(400, 20); g.randomWeights(randomInteger,1,9999);
tester.addTest('large random (400, 20)', g);

g = randomGraph(400, 80); g.randomWeights(randomInteger,1,9999);
tester.addTest('large random dense (400, 80)', g);

g = randomGraph(400, 320); g.randomWeights(randomInteger,1,9999);
tester.addTest('large random denser (400, 320)', g);

tester.run();
