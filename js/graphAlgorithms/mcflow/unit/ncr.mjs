/** \file ncr.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../../common/Errors.mjs';
import Tester from '../../../common/Tester.mjs';
import ncrK from '../ncrK.mjs';
import ncrKGT from '../ncrKGT.mjs';
import ncrJEK from '../ncrJEK.mjs';
import mcflowVerify from '../mcflowVerify.mjs';
import List from '../../../dataStructures/basic/List.mjs';
import Flograph from '../../../dataStructures/graphs/Flograph.mjs';
import { randomFraction, randomInteger } from '../../../common/Random.mjs';
import { randomGraph, randomFlograph } from '../../misc/RandomGraph.mjs';

function run(g, trace, f) { g.clearFlow(); return f(g, trace); }

let algomap = {
	'K' : (g,trace) => run(g, trace, ncrK),
	'KGT' : (g,trace) => run(g, trace, ncrKGT),
	'JEK' : (g,trace) => run(g, trace, ncrJEK)
}

function verify(g) { return mcflowVerify(g); }

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, 'ncr', algomap, verify);

let g = randomFlograph(12, 3);
g.randomCapacities(randomInteger, 1, 9);
g.randomCosts(randomInteger, -9, 9);
tester.addTest(`small random (${g.n},${g.m})`, g);

g = randomFlograph(32, 10);
g.randomCapacities(randomInteger, 1, 99);
g.randomCosts(randomInteger, -99, 99);
tester.addTest(`medium random (${g.n},${g.m})`, g);

g = randomFlograph(62, 15);
g.randomCapacities(randomInteger, 1, 999);
g.randomCosts(randomInteger, -999, 999);
tester.addTest(`large random (${g.n},${g.m})`, g);

g = randomFlograph(122, 20);
g.randomCapacities(randomInteger, 1, 999);
g.randomCosts(randomInteger, -999, 999);
tester.addTest(`large random (${g.n},${g.m})`, g);

tester.run();
