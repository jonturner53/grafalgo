/** \file setCover.mjs
 *
 *  @author Jon Turner
 *  @date 2024
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { Tester } from '../../../common/Testing.mjs';
import { assert, EnableAssert as ea } from '../../../common/Assert.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import setCoverVerify from '../setCoverVerify.mjs';
import setCoverRandom from '../setCoverRandom.mjs';
import setCoverBYE from '../setCoverBYE.mjs';
import setCoverC from '../setCoverC.mjs';
import {randomInteger, randomFraction} from '../../../common/Random.mjs';

let algomap = {
	'bye' : ['setCoverBYE', setCoverBYE, setCoverVerify],
	'c' : ['setCoverC', setCoverC, setCoverVerify]
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, algomap);

let g = new Graph();
g.fromString('{a[e h j m p] b[f g i n o] c[g k l m p] d[f h k l o]}');
g.setBipartition();
let weight = [0,3,7,4,8];
tester.addTest('small set cover instance (4,12): 14,2', g, weight);

let coverWt, maxcover;
[g, weight, coverWt, maxcover] =
				setCoverRandom(6, 18, 3, .5, randomInteger, 3, 9);
tester.addTest(`small random instance (6,18,3,.5): ${coverWt},${maxcover}`,
				g, weight);

[g, weight, coverWt, maxcover] =
				setCoverRandom(50,200,10,.5, randomInteger, 3, 9);
tester.addTest(`medium random instance (50,200,10,.5): ${coverWt},${maxcover}`,
				g, weight);

[g, weight, coverWt, maxcover] =
				setCoverRandom(100,2000,20,.5, randomInteger, 3, 9);
tester.addTest(`large random instance (100,2000,20,.5): ${coverWt},${maxcover}`,
				g, weight);

tester.run();
