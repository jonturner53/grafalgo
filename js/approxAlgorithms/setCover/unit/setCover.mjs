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
	'c' : ['setCoverC',
		   (g,weight,trace) => setCoverC(g,weight,0,0,trace),setCoverVerify],
	'cr' : ['setCoverCr',
		    (g,weight,trace) => setCoverC(g, weight, 0,
				(s,covered,uncovered,width) => (1+covered[s])/uncovered[s],
				 trace), setCoverVerify]
}

function p2s(props) {
	let wsb = props.splitBound;
	wsb = Number.isInteger(wsb) ? wsb : wsb.toFixed(2);
	return `[${props.sizeBound} ${wsb} ${props.labelBound}` +
			` ${props.seedWeight}]`;
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, algomap);

let g = new Graph();
g.fromString('{a[e h j m p] b[f g i n o] c[g k l m p] d[f h k l o]}');
g.setBipartition(4);
let weight = [0,3,7,4,8];
tester.addTest('small set cover instance (4,12)', g, weight);

let props;
[g,weight, props] = setCoverRandom(8, 16, 2, 1, randomInteger, 1, 1);
tester.addTest(`small unit weight random (8,16,2,1): ${p2s(props)}`, g, weight);

[g,weight, props] = setCoverRandom(6, 18, 2, .5, randomInteger, 2, 20);
tester.addTest(`small random (6,18,2,.5): ${p2s(props)}`, g, weight);

[g,weight, props] = setCoverRandom(6, 18, 2, 1, randomInteger, 1, 1);
tester.addTest(`small unit weight random (6,18,2,1): ${p2s(props)}`, g, weight);

[g, weight, props] = setCoverRandom(50,200,5,.5, randomInteger, 5, 99);
tester.addTest(`medium random (50,200,5,.5): ${p2s(props)}`, g, weight);

[g, weight, props] = setCoverRandom(50,200,5,1, randomInteger, 1, 1);
tester.addTest(`medium unit weight random (50,200,5,1): ${p2s(props)}`, g, weight);

[g, weight, props] = setCoverRandom(100,2000,5,.5, randomInteger, 10, 999);
tester.addTest(`large random (100,2000,5,.5): ${p2s(props)}`, g, weight);

tester.run();
