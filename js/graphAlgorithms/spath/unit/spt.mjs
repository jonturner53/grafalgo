/** \file spt.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../../common/Errors.mjs';
import Tester from '../../../common/Tester.mjs';

import sptDag from '../sptDag.mjs';
import sptD from '../sptD.mjs';
import sptDf from '../sptDf.mjs';
import sptBM from '../sptBM.mjs';
import sptVerify from '../sptVerify.mjs';
import Digraph from '../../../dataStructures/graphs/Digraph.mjs';
import { randomFraction, randomInteger } from '../../../common/Random.mjs';
import { randomDigraph, randomDag } from '../../misc/RandomGraph.mjs';

let algomap = {
	'Dag' : sptDag,
	'D' : sptD,
	'Df' : sptDf,
	'BM' : sptBM
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, 'spt', algomap, sptVerify);

let g = new Digraph(); g.fromString(
		'{a[b:3 d:2 j:4] b[c:7 f:4 i:1] c[d:1 f:2 g:3] ' +
		'd[b:1 e:3] e[a:5 g:1] f[c:3 e:1 i:2]' +
		'g[b:2 h:2 j:1] h[i:1 e:1] i[c:3 f:1]' +
		'j[b:1 c:2 g:5]}');
tester.addTest('small graph', g, 1);

g = randomDigraph(10, 3.5); g.randomLengths(randomInteger, 1, 99);
tester.addTest('small random graph', g, 1);

g = randomDag(10, 3); g.randomLengths(randomInteger, 1, 99);
tester.addTest('small random dag', g, 1);

g = randomDigraph(10, 3.5); g.randomLengths(randomInteger, -15, 99);
tester.addTest('small random graph with negative edges', g, 1);

g = randomDigraph(1000, 10); g.randomLengths(randomFraction);
tester.addTest('large random graph', g, 1);

tester.run();
