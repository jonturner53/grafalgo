/** \file flowfloorTest.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../../common/Errors.mjs';
import Tester from '../../../common/Tester.mjs';
import maxflowD from '../maxflowD.mjs';
import flowfloor from '../flowfloor.mjs';
import maxflowVerify from '../maxflowVerify.mjs';
import List from '../../../dataStructures/basic/List.mjs';
import Flograph from '../../../dataStructures/graphs/Flograph.mjs';
import { randomFraction, randomInteger } from '../../../common/Random.mjs';
import { randomGraph, randomFlograph } from '../../misc/RandomGraph.mjs';

/** usage: flowfloorTest flowfloor [trace] [stats] */

function run(g, trace) {
	g.clearFlow();
	let ts = '';
	if (trace) ts += g.toString(0,1)
	let [success, ts1, stats1] = flowfloor(g, trace);
	if (trace) ts += ts1 + g.toString(0,1);
	if (!success) ts += 'unable to satisfy flow floors\n';
	let [ts2] = maxflowD(g, trace);
	if (trace) ts += ts2 + g.toString(0,1);
	return [ts, stats1];
}

let algomap = {
	'flowfloor' : (g, trace) => run(g, trace)
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, '', algomap, maxflowVerify);

let g = new Flograph(); g.fromString(
	'{a->[b:3 d:2] b[c:3 d:2-7 g:3] c[d:1 e:5] d[e:2 f:1 g:3] ' +
	'e[f:1 g:3 h:4] f[e:1 g:2 h:3] g[e:3 f:2 h:1] ' +
	'h[f:3 i:4 j:2] i[g:1-5 j:6] ->j[]}');
tester.addTest('small graph', g);

g = randomFlograph(14, 5, 3, 1, 1);
g.randomCapacities(randomInteger, 1, 19);
g.randomFloors(randomInteger, 0, 1);
tester.addTest('small random', g);

g = randomFlograph(62, 10, 10, 2, 2);
g.randomCapacities(randomInteger, 1, 99);
g.randomFloors(randomInteger, 0, 2);
tester.addTest('medium random', g);

g = randomFlograph(152, 20, 20, 2, 2);
g.randomCapacities(randomInteger, 1, 99);
g.randomFloors(randomInteger, 0, 7);
tester.addTest('large random', g);

tester.run();
