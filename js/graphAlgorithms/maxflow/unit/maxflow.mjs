/** \file maxflow.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../../common/Errors.mjs';
import Tester from '../../../common/Tester.mjs';
import maxflowHardcase from '../maxflowHardcase.mjs';
import maxflowFFsp from '../maxflowFFsp.mjs';
import maxflowD from '../maxflowD.mjs';
import maxflowDST from '../maxflowDST.mjs';
import maxflowFFmc from '../maxflowFFmc.mjs';
import maxflowFFcs from '../maxflowFFcs.mjs';
import maxflowPPf from '../maxflowPPf.mjs';
import maxflowPPhl from '../maxflowPPhl.mjs';
import maxflowVerify from '../maxflowVerify.mjs';
import List from '../../../dataStructures/basic/List.mjs';
import Flograph from '../../../dataStructures/graphs/Flograph.mjs';
import { randomFraction, randomInteger } from '../../../common/Random.mjs';
import { randomGraph, randomFlograph } from '../../misc/RandomGraph.mjs';

function run(g, trace, f) { g.clearFlow(); return f(g,trace); }

let algomap = {
	'FFsp' : (g, trace) => run(g, trace, maxflowFFsp),
	'D' : (g, trace) => run(g, trace, maxflowD),
	'DST' : (g, trace) => run(g, trace, maxflowDST),
	'FFmc' : (g, trace) => run(g, trace, maxflowFFmc),
	'FFcs' : (g, trace) => run(g, trace, maxflowFFcs),
	'PPf' : (g, trace) => run(g, trace, maxflowPPf),
	'PPhl' : (g, trace) => run(g, trace, maxflowPPhl),
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, 'maxflow', algomap, maxflowVerify);

let g = new Flograph(); g.fromString(
			'{a->[b:5 d:6] b[c:3 d:7 g:3] c[d:1 e:5] d[e:2 f:1 g:3] ' +
			'e[f:1 g:3 h:4] f[e:1 g:2 h:3] g[e:3 f:2 h:1] ' +
			'h[f:3 i:4 j:5] i[g:5 j:6] ->j[]}');
tester.addTest('small graph', g);

tester.addTest('hardcase(10,10)', maxflowHardcase(10, 10));
tester.addTest('hardcase(20,10)', maxflowHardcase(20, 10));
tester.addTest('hardcase(10,20)', maxflowHardcase(10, 20));

g = randomFlograph(14, 5, 3, 1, 1); g.randomCapacities(randomInteger, 5, 15);
tester.addTest('small random', g);

g = randomFlograph(62, 10, 10, 2, 2); g.randomCapacities(randomInteger, 1, 99);
tester.addTest('medium random', g);

g = randomFlograph(152, 20, 20, 2, 2); g.randomCapacities(randomInteger, 1, 99);
tester.addTest('large random', g);

tester.run();
