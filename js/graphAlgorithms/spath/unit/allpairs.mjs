/** \file allpairs.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError } from '../../../common/Errors.mjs';
import Tester from '../../../common/Tester.mjs';
import allpairsF from '../allpairsF.mjs';
import allpairsEK from '../allpairsEK.mjs';
import sptVerify from '../sptVerify.mjs';
import Digraph from '../../../dataStructures/graphs/Digraph.mjs';
import { randomFraction, randomInteger } from '../../../common/Random.mjs';
import { randomDigraph } from '../../misc/RandomGraph.mjs';

function verify(g, pedge, dist) {
	for (let s = 1; s <= g.n; s++) {
		let err = sptVerify(g, s, pedge[s], dist[s]);
		if (err.length > 0) return err;
	}
	return '';
}

let algomap = {
	'F' : allpairsF,
	'EK' : allpairsEK
}


let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, 'allpairs', algomap, verify);

let g = new Digraph();
g.fromString('{a[b:3 d:-2 f:4] b[c:7 e:4 f:1] c[d:1 f:2] ' +
			 'd[b:1 e:3] e[a:5 b:1] f[c:3 d:1 e:-2]}' );
tester.addTest('small graph', g);

g = randomDigraph(10, 3.5); g.randomLengths(randomInteger, -3, 20);
tester.addTest('small random graph', g);

g = randomDigraph(300, 10); g.randomLengths(randomInteger, -3, 99);
tester.addTest('large random graph', g);

tester.run();
