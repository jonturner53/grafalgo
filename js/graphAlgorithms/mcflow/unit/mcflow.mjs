/** \file mcflow.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../../common/Errors.mjs';
import Tester from '../../../common/Tester.mjs';
import maxflowD from '../../maxflow/maxflowD.mjs';
import ncrJEK from '../ncrJEK.mjs';
import mcflowJ from '../mcflowJ.mjs';
import mcflowJEK from '../mcflowJEK.mjs';
import mcflowO from '../mcflowO.mjs';
import maxflowVerify from '../../maxflow/maxflowVerify.mjs';
import mcflowVerify from '..//mcflowVerify.mjs';
import List from '../../../dataStructures/basic/List.mjs';
import Flograph from '../../../dataStructures/graphs/Flograph.mjs';
import { randomFraction, randomInteger } from '../../../common/Random.mjs';
import { randomGraph, randomFlograph } from '../../misc/RandomGraph.mjs';

let algomap = {
	'J' : (g,trace) => run(g,trace,mcflowJ),
	'JEK' : (g,trace) => run(g,trace,mcflowJEK),
	'O' : (g,trace) => run(g,trace,mcflowO)
}

function run(g, trace, algo) {
	g.clearFlow(); ncrJEK(g); return algo(g,trace);
}

function verify(g) {
	let err = maxflowVerify(g);
	if (err.length > 0) return err;
	return mcflowVerify(g);
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, 'mcflow', algomap, verify);

let g = new Flograph(); g.fromString(
	'{a->[b:5@1 d:6@-1] b[c:3@3 d:7@1 g:3@2] c[d:1@2 e:5@1] ' +
	'd[b:3@2 e:2@1 f:1@2 g:3@1] ' +
	'e[f:1@-1 g:3@1 h:4] f[e:1@1 g:2@2 h:3@1] g[e:3@3 f:2@4 h:1@6] ' +
	'h[f:3@1 i:4@2 j:5@2] i[h:4@2 g:5@1 j:6@1] ->j[]}');
tester.addTest('small graph', g);

g = randomFlograph(14, 4, 3);
g.randomCapacities(randomInteger, 1, 9);
g.randomCosts(randomInteger, -9, 9); 
tester.addTest(`small random (${g.n},${g.m})`, g);

g = randomFlograph(32, 10);
g.randomCapacities(randomInteger, 1, 99);
g.randomCosts(randomInteger, -9, 99); 
tester.addTest(`medium random (${g.n},${g.m})`, g);

g = randomFlograph(62, 15);
g.randomCapacities(randomInteger, 1, 999);
g.randomCosts(randomInteger, -99, 999); 
tester.addTest(`large random (${g.n},${g.m})`, g);

g = randomFlograph(122, 20);
g.randomCapacities(randomInteger, 1, 999);
g.randomCosts(randomInteger, -99, 999); 
tester.addTest(`large random (${g.n},${g.m})`, g);

tester.run();
