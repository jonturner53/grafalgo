/** \file setCover.mjs
 *
 *  @author Jon Turner
 *  @date 2024
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { Tester } from '../../../common/Testing.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import setCoverVerify from '../setCoverVerify.mjs';
import setCoverRandom from '../setCoverRandom.mjs';
import setCoverBYE from '../setCoverBYE.mjs';
import setCoverC from '../setCoverC.mjs';
import {randomInteger, randomFraction} from '../../../common/Random.mjs';

let algomap = {
	'bye' : ['setCoverBYE', setCoverBYE, setCoverVerify],
	'c' : ['setCoverC',
		   (g,weight,trace) => setCoverC(g,weight,0,0,trace),setCoverVerify],
	'cr' : ['setCoverCr',
		    (g,weight,trace) => setCoverC(g, weight, 0,
				(s,covered,uncovered,width) => (1+covered[s])/uncovered[s],
				 trace), setCoverVerify]
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, algomap);

let weight = [0,3,7,4,8];
let g = Graph.fromString('{a[e h j m p] b[f g i n o] c[g k l m p] ' +
						 'd[f h k l o]}');
g.setBipartition(4);
tester.addTest('small set cover instance (4,12)', g, weight);

let lowerBounds, upperBound;

[g,weight, lowerBounds,upperBound] =
				setCoverRandom(6, 18, 2, [3,2], randomInteger, 2, 15);
tester.addTest(`small random (6,18,2,[3,2]): ` +
				`[${lowerBounds}], ${upperBound}`, g, weight);

[g,weight, lowerBounds,upperBound] =
				setCoverRandom(6, 18, 2, 1, randomInteger, 2, 15);
tester.addTest(`small random (6,18,2,[1,1]): ` +
				`[${lowerBounds}], ${upperBound}`, g, weight);

[g,weight, lowerBounds,upperBound] =
				setCoverRandom(6, 18, 2, [3,2]);
tester.addTest(`small unit weight random (6,18,2,[3,2]): ` +
				`[${lowerBounds}], ${upperBound}`, g, weight);

[g, weight, lowerBounds,upperBound] =
				setCoverRandom(50,200,5, [5,3], randomInteger, 5, 99);
tester.addTest(`medium random (50,200,5,[5,3]): ` +
				`[${lowerBounds}], ${upperBound}`, g, weight);

[g, weight, lowerBounds,upperBound] =
				setCoverRandom(50,200,5, [5,3]);
tester.addTest(`medium unit weight random (50,200,5,[5,3]): ` +
				`[${lowerBounds}], ${upperBound}`, g, weight);

[g, weight, lowerBounds, upperBound] =
				setCoverRandom(100,2000,5, [10,3], randomInteger, 10, 999);
tester.addTest(`large random (100,2000,5,[10,3]): ` +
				`[${lowerBounds}], ${upperBound}`, g, weight);

tester.run();
